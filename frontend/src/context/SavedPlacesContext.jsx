import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  addPlaceReview,
  getPlaces,
  getProfile,
  saveProfile,
} from '../services/api';
import {
  getInitialPlacesCatalog,
  mergeWithCatalog,
} from '../constants/placesCatalog';

const DEVICE_ID = 'explorador-shilico';
export const MAX_REVIEWS_PER_ITEM = 20;
const SavedPlacesContext = createContext(null);

export function SavedPlacesProvider({ children }) {
  const [places, setPlaces] = useState(() => getInitialPlacesCatalog());
  const [savedIds, setSavedIds] = useState(() =>
    getInitialPlacesCatalog()
      .filter((item) => item.defaultSaved)
      .map((item) => item.id)
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [darkMode, setDarkModeState] = useState(false);
  const [language, setLanguageState] = useState('es');
  const [offlineReady, setOfflineReadyState] = useState(false);

  const syncPlaces = async () => {
    setRefreshing(true);
    try {
      const [placesRes, profileRes] = await Promise.allSettled([
        getPlaces(),
        getProfile(DEVICE_ID),
      ]);

      if (placesRes.status === 'fulfilled' && placesRes.value?.length) {
        setPlaces(mergeWithCatalog(placesRes.value));
      }

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const prof = profileRes.value;
        if (Array.isArray(prof.savedPlaceIds)) {
          setSavedIds(prof.savedPlaceIds);
        }
        if (typeof prof.darkMode === 'boolean') {
          setDarkModeState(prof.darkMode);
        }
        if (prof.language === 'es' || prof.language === 'en') {
          setLanguageState(prof.language);
        }
        if (typeof prof.offlineReady === 'boolean') {
          setOfflineReadyState(prof.offlineReady);
        }
      }
    } catch {
      // Mantiene datos locales para funcionamiento 100% offline
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    syncPlaces();
  }, []);

  const persistProfilePatch = (patch) => {
    saveProfile(DEVICE_ID, patch).catch(() => {
      // Sin conexión: el estado local sigue funcionando sin interrupciones
    });
  };

  const toggleSaved = (placeId) => {
    setSavedIds((prev) => {
      const next = prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId];
      persistProfilePatch({ savedPlaceIds: next });
      return next;
    });
  };

  const setDarkMode = (value) => {
    setDarkModeState(Boolean(value));
    persistProfilePatch({ darkMode: Boolean(value) });
  };

  const setLanguage = (lang) => {
    const normalized = lang === 'en' ? 'en' : 'es';
    setLanguageState(normalized);
    persistProfilePatch({ language: normalized });
  };

  const setOfflineReady = (value) => {
    setOfflineReadyState(Boolean(value));
    persistProfilePatch({ offlineReady: Boolean(value) });
  };

  const submitPlaceReview = async (placeId, rating, comentario, autor) => {
    const current = places.find((item) => item.id === placeId);
    if (current && Number(current.resenasCount ?? 0) >= MAX_REVIEWS_PER_ITEM) {
      return {
        ok: false,
        savedRemote: false,
        error: `Se alcanzó el límite máximo de ${MAX_REVIEWS_PER_ITEM} reseñas para este destino.`,
      };
    }

    const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const trimmedAuthor = (autor || 'Viajero Explorador').trim().slice(0, 35) || 'Viajero Explorador';
    const trimmedComment = (comentario || '').trim().slice(0, 180);
    const reviewEntry = trimmedComment
      ? {
          autor: trimmedAuthor,
          fecha: 'Reciente',
          rating: cleanRating,
          comentario: trimmedComment,
        }
      : null;

    const prevPlacesSnapshot = places;

    setPlaces((prev) =>
      prev.map((item) => {
        if (item.id !== placeId) return item;
        const count = Number(item.resenasCount ?? 0);
        const prevSum = Number(item.ratingSum ?? Number(item.rating || 0) * count);
        const nextCount = count + 1;
        const nextSum = prevSum + cleanRating;
        const nextAvg = (nextSum / nextCount).toFixed(1);
        return {
          ...item,
          resenasCount: nextCount,
          ratingSum: nextSum,
          rating: nextAvg,
          resenas: reviewEntry
            ? [reviewEntry, ...(item.resenas || [])].slice(0, MAX_REVIEWS_PER_ITEM)
            : item.resenas || [],
        };
      })
    );

    try {
      const updated = await addPlaceReview(placeId, {
        rating: cleanRating,
        comentario: trimmedComment,
        autor: trimmedAuthor,
      });
      if (updated && updated.id) {
        setPlaces((prev) =>
          mergeWithCatalog(prev.map((p) => (p.id === updated.id ? updated : p)))
        );
      }
      return { ok: true, savedRemote: true };
    } catch (err) {
      if (err?.status === 409 || err?.status === 429 || err?.status === 400) {
        setPlaces(prevPlacesSnapshot);
        return { ok: false, savedRemote: false, error: err.message };
      }
      return { ok: true, savedRemote: false };
    }
  };

  const savedPlaces = useMemo(
    () => places.filter((p) => savedIds.includes(p.id)),
    [places, savedIds]
  );

  const value = useMemo(
    () => ({
      places,
      savedIds,
      savedPlaces,
      refreshing,
      showWelcome,
      setShowWelcome,
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      offlineReady,
      setOfflineReady,
      syncPlaces,
      toggleSaved,
      submitPlaceReview,
      isSaved: (id) => savedIds.includes(id),
    }),
    [
      places,
      savedIds,
      savedPlaces,
      refreshing,
      showWelcome,
      darkMode,
      language,
      offlineReady,
    ]
  );

  return (
    <SavedPlacesContext.Provider value={value}>
      {children}
    </SavedPlacesContext.Provider>
  );
}

export function useSavedPlaces() {
  const ctx = useContext(SavedPlacesContext);
  if (!ctx) {
    throw new Error('useSavedPlaces must be used within SavedPlacesProvider');
  }
  return ctx;
}
