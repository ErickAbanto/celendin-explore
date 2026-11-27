import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDirectoryReview,
  addPlaceReview,
  createDirectoryItem,
  createPlace,
  deleteDirectoryItem,
  deletePlace,
  getDirectory,
  getPlaces,
  getProfile,
  saveProfile,
  updateDirectoryItem,
  updatePlace,
} from '../services/api';
import {
  getInitialPlacesCatalog,
  mergeWithCatalog,
} from '../constants/placesCatalog';

const DEVICE_ID = 'explorador-shilico';
export const MAX_REVIEWS_PER_ITEM = 20;
const SavedPlacesContext = createContext(null);

const LEGACY_FICTITIOUS_DIR_IDS = new Set([
  'dir-tradicion-shilica',
  'dir-chocolateria-eden',
  'dir-taller-toquilla',
  'dir-hotel-edendelnorte',
  'dir-posada-san-isidro',
]);

export const INITIAL_HOME_BANNERS = [
  {
    id: 'inicio-portada',
    etiqueta: 'Portada',
    titulo: 'Explora Celendín',
    subtitulo:
      'Naturaleza, cultura y gastronomía en la provincia de Celendín, Cajamarca.',
    destino: 'Lugares',
  },
];

export const INITIAL_EMERGENCY_NUMBERS = [
  {
    id: 'pnp',
    titulo: 'Comisaría PNP Celendín',
    numero: '964 765 077',
    tel: '964765077',
    detalle: 'Av. Cajamarca Cdra. 1 · Central 105',
  },
  {
    id: 'hospital',
    titulo: 'Hospital de Apoyo Celendín',
    numero: '971 764 243',
    tel: '971764243',
    detalle: 'Av. Túpac Amaru S/N · Emergencias',
  },
  {
    id: 'samu',
    titulo: 'SAMU Emergencias',
    numero: '106',
    tel: '106',
    detalle: 'Atención médica gratuita',
  },
];

export const INITIAL_BUS_AGENCIES = [
  {
    id: 'bus-palacios',
    tipo: 'buses',
    empresa: 'Transportes Palacios',
    ruta: 'Celendín ↔ Cajamarca (Salidas mañana y tarde)',
    terminal: 'Jr. Pardo Nº 462, Celendín',
  },
  {
    id: 'bus-royal-palace',
    tipo: 'buses',
    empresa: "Transportes Royal Palace's",
    ruta: 'Celendín ↔ Cajamarca ↔ Lima',
    terminal: 'Jr. Unión Nº 405, Celendín',
  },
  {
    id: 'bus-virgen-carmen',
    tipo: 'buses',
    empresa: 'Turismo Virgen del Carmen',
    ruta: 'Celendín ↔ Cajamarca',
    terminal: 'Terminal Terrestre · Jr. Cáceres Nº 142, Celendín',
  },
  {
    id: 'combi-araujo',
    tipo: 'combis',
    empresa: 'Transportes Araujo (Combis / Minivans)',
    ruta: 'Celendín ↔ Cajamarca (Salidas desde las 5:00 AM)',
    terminal: 'Terminal Terrestre · Jr. Cáceres Nº 142 (Of. 03), Celendín',
  },
  {
    id: 'combi-rojas',
    tipo: 'combis',
    empresa: 'Transporte y Turismo Rojas',
    ruta: 'Celendín ↔ La Encañada ↔ Cajamarca',
    terminal: 'Av. Amazonas Nº 313, Celendín',
  },
  {
    id: 'auto-colectivos-caceres',
    tipo: 'autos',
    empresa: 'Autos Colectivos Directos a Cajamarca',
    ruta: 'Celendín ↔ Cajamarca (~2h directo vía asfaltada)',
    terminal: 'Jr. Cáceres Nº 114 – 142 (Entorno Terminal Terrestre)',
  },
  {
    id: 'auto-manantial',
    tipo: 'autos',
    empresa: 'Colectivos El Manantial / Regionales',
    ruta: 'Celendín ↔ Cajamarca (Salidas continuas al completar 4 pasajeros)',
    terminal: 'Jr. Cáceres con Jr. Dos de Mayo, Celendín',
  },
];

export const INITIAL_VERIFIED_DIRECTORY = [
  {
    id: 'dir-la-reserve',
    categoria: 'Gastronomía',
    badge: 'Restaurante',
    rangoPrecio: 'S/ 20 - S/ 45',
    nombre: 'Restaurant La Reserve',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Cuy frito, cecina shilica y platos típicos',
    direccion: 'Jr. José Gálvez 404-A, Celendín',
    telefono: '+51976579996',
    whatsapp: '51976579996',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    id: 'dir-chokosol',
    categoria: 'Gastronomía',
    badge: 'Chocolatería',
    rangoPrecio: 'S/ 10 - S/ 35',
    nombre: 'Chocolatería Chokosol',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Chocolate artesanal de taza 100% cacao',
    direccion: 'Jr. Dos de Mayo 713, Celendín',
    telefono: '+51931361444',
    whatsapp: '51931361444',
    imagen: '/images/chocolate-celendin.jpg',
  },
  {
    id: 'dir-intimachay',
    categoria: 'Gastronomía',
    badge: 'Cafetería',
    rangoPrecio: 'S/ 15 - S/ 40',
    nombre: 'Cafetería Intimachay',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Café de especialidad y comida campestre',
    direccion: 'Km 3 Carretera Celendín – Cajamarca',
    telefono: '+51954366114',
    whatsapp: '51954366114',
    imagen: '/images/celendin-hero.jpg',
  },
  {
    id: 'dir-ecosol-toquilla',
    categoria: 'Artesanía',
    badge: 'Artesanía',
    rangoPrecio: 'S/ 15 - S/ 320',
    nombre: 'Eco Sol & Shilicolate',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Sombreros de paja toquilla y chocolates',
    direccion: 'Jr. Cáceres 820, Celendín',
    telefono: '+51949828838',
    whatsapp: '51949828838',
    imagen: '/images/sombrero-shilico.jpg',
  },
  {
    id: 'dir-hotel-loyers',
    categoria: 'Hoteles',
    badge: 'Hotel',
    rangoPrecio: 'S/ 70 - S/ 150',
    nombre: "Hotel Loyer's",
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Habitaciones con Wi-Fi, agua caliente y cochera',
    direccion: 'Jr. José Gálvez 410, Celendín',
    telefono: '+51076555210',
    whatsapp: '51995934231',
    imagen: '/images/plaza-armas.jpg',
  },
  {
    id: 'dir-hostal-celendin',
    categoria: 'Hoteles',
    badge: 'Hostal',
    rangoPrecio: 'S/ 60 - S/ 130',
    nombre: 'Hostal Celendín',
    verificado: true,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    especialidad: 'Hospedaje frente a la Plaza de Armas y restaurante',
    direccion: 'Jr. Unión 305, Plaza de Armas',
    telefono: '+51995934231',
    whatsapp: '51995934231',
    imagen: '/images/mirador-san-isidro.jpg',
  },
];

function buildSlugId(prefix, text) {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const suffix = Date.now().toString(36).slice(-4);
  return `${prefix}-${base || 'item'}-${suffix}`;
}

export function SavedPlacesProvider({ children }) {
  const [places, setPlaces] = useState(() => getInitialPlacesCatalog());
  const [directoryItems, setDirectoryItems] = useState(
    () => INITIAL_VERIFIED_DIRECTORY
  );
  const [homeBanners, setHomeBanners] = useState(() => INITIAL_HOME_BANNERS);
  const [emergencyNumbers, setEmergencyNumbers] = useState(
    () => INITIAL_EMERGENCY_NUMBERS
  );
  const [busAgencies, setBusAgencies] = useState(() => INITIAL_BUS_AGENCIES);

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

  // Estado del Panel de Administrador Oculto
  const [adminVisible, setAdminVisible] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('inicio');

  const deletedPlaceIdsRef = useRef(new Set());
  const editedPlacesRef = useRef({});
  const deletedDirIdsRef = useRef(new Set());
  const editedDirRef = useRef({});

  const openAdminPanel = (tab = 'inicio') => {
    setAdminInitialTab(tab);
    setAdminVisible(true);
  };

  const applyPlaceAdminOverrides = (list) => {
    return list
      .filter((item) => item && !deletedPlaceIdsRef.current.has(item.id))
      .map((item) =>
        editedPlacesRef.current[item.id]
          ? { ...item, ...editedPlacesRef.current[item.id] }
          : item
      );
  };

  const applyDirAdminOverrides = (remoteList, currentList = []) => {
    const cleanRemote = (Array.isArray(remoteList) ? remoteList : []).filter(
      (item) =>
        item &&
        item.id &&
        !LEGACY_FICTITIOUS_DIR_IDS.has(item.id) &&
        !deletedDirIdsRef.current.has(item.id)
    );

    const matchedIds = new Set();
    const baseMerged = INITIAL_VERIFIED_DIRECTORY.filter(
      (b) => !deletedDirIdsRef.current.has(b.id)
    ).map((baseItem) => {
      matchedIds.add(baseItem.id);
      const localCur = (Array.isArray(currentList) ? currentList : []).find(
        (c) => c.id === baseItem.id
      );
      const hasLocalVotes = (localCur?.resenasCount ?? 0) > 0;
      const merged = {
        ...baseItem,
        resenasCount: hasLocalVotes ? localCur.resenasCount : 0,
        ratingSum: hasLocalVotes ? localCur.ratingSum : 0,
        rating: hasLocalVotes ? localCur.rating : '0.0',
      };

      return editedDirRef.current[baseItem.id]
        ? { ...merged, ...editedDirRef.current[baseItem.id] }
        : merged;
    });

    const extraRemote = cleanRemote
      .filter((r) => {
        if (matchedIds.has(r.id)) return false;
        matchedIds.add(r.id);
        return true;
      })
      .map((r) =>
        editedDirRef.current[r.id] ? { ...r, ...editedDirRef.current[r.id] } : r
      );

    const extraLocal = (Array.isArray(currentList) ? currentList : [])
      .filter(
        (item) =>
          item &&
          item.id &&
          !LEGACY_FICTITIOUS_DIR_IDS.has(item.id) &&
          !deletedDirIdsRef.current.has(item.id) &&
          !matchedIds.has(item.id)
      )
      .map((item) =>
        editedDirRef.current[item.id]
          ? { ...item, ...editedDirRef.current[item.id] }
          : item
      );

    return [...extraLocal, ...baseMerged, ...extraRemote];
  };

  const syncPlaces = async () => {
    setRefreshing(true);
    try {
      const [placesRes, dirRes, profileRes] = await Promise.allSettled([
        getPlaces(),
        getDirectory(),
        getProfile(DEVICE_ID),
      ]);

      if (placesRes.status === 'fulfilled' && placesRes.value?.length) {
        setPlaces((prev) =>
          applyPlaceAdminOverrides(mergeWithCatalog(placesRes.value, prev))
        );
      }

      if (dirRes.status === 'fulfilled' && dirRes.value?.length) {
        setDirectoryItems((prev) =>
          applyDirAdminOverrides(dirRes.value, prev)
        );
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
      // Mantiene datos locales
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    syncPlaces();
  }, []);

  const persistProfilePatch = (patch) => {
    saveProfile(DEVICE_ID, patch).catch(() => {});
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

  // ================= CRUD DE INICIO (BANNERS / ANUNCIOS) =================
  const addHomeBanner = (input) => {
    const titulo = String(input?.titulo || '').trim();
    const etiqueta =
      String(input?.etiqueta || 'DESTACADO EN INICIO').trim() ||
      'DESTACADO EN INICIO';
    const subtitulo = String(input?.subtitulo || '').trim();
    const destino =
      input?.destino === 'Lugares' || input?.destino === 'Perfil / Offline'
        ? input.destino
        : 'Directorio';

    if (!titulo) {
      return { ok: false, error: 'El título del bloque de Inicio es obligatorio.' };
    }

    const newBanner = {
      id: buildSlugId('home', titulo),
      etiqueta: etiqueta.toUpperCase(),
      titulo,
      subtitulo,
      destino,
    };
    setHomeBanners((prev) => [newBanner, ...prev]);
    return { ok: true, item: newBanner };
  };

  const editHomeBanner = (bannerId, input) => {
    const titulo = String(input?.titulo || '').trim();
    const etiqueta =
      String(input?.etiqueta || 'DESTACADO EN INICIO').trim() ||
      'DESTACADO EN INICIO';
    const subtitulo = String(input?.subtitulo || '').trim();
    const destino =
      input?.destino === 'Lugares' || input?.destino === 'Perfil / Offline'
        ? input.destino
        : 'Directorio';

    if (!titulo) {
      return { ok: false, error: 'El título del bloque de Inicio es obligatorio.' };
    }

    setHomeBanners((prev) =>
      prev.map((b) =>
        b.id === bannerId
          ? {
              ...b,
              etiqueta: etiqueta.toUpperCase(),
              titulo,
              subtitulo,
              destino,
            }
          : b
      )
    );
    return { ok: true };
  };

  const removeHomeBanner = (bannerId) => {
    setHomeBanners((prev) => prev.filter((b) => b.id !== bannerId));
    return { ok: true };
  };

  // ================= CRUD DE LUGARES =================
  const addNewPlace = async (input) => {
    const nombre = String(input?.nombre || '').trim();
    const ubicacion = String(input?.ubicacion || '').trim();
    const desc = String(input?.desc || '').trim();
    const categoria = String(input?.categoria || 'Naturaleza').trim();

    if (!nombre || !ubicacion || !desc) {
      return {
        ok: false,
        error: 'Completa el nombre, ubicación y descripción.',
      };
    }

    const distanciaCorta =
      String(input?.distanciaCorta || 'Centro').trim() || 'Centro';
    const altitudTexto =
      String(input?.altitudTexto || '2,625 m').trim() || '2,625 m';
    const precioTexto =
      String(input?.precioTexto || 'Libre').trim() || 'Libre';
    const horario =
      String(input?.horario || '8:00 am – 5:00 pm').trim() ||
      '8:00 am – 5:00 pm';
    const imagen =
      String(input?.imagen || '/images/celendin-hero.jpg').trim() ||
      '/images/celendin-hero.jpg';

    const newPlace = {
      id: buildSlugId('lugar', nombre),
      nombre,
      ubicacion,
      direccionCorta: ubicacion,
      distancia: `A ${distanciaCorta} de Celendín`,
      distanciaCorta,
      distanciaGrid: distanciaCorta,
      altitudTexto,
      categoria,
      categoriaFiltro: categoria,
      precioTexto,
      rating: '0.0',
      ratingSum: 0,
      resenasCount: 0,
      etiquetaDestacado: categoria,
      mapsLabel: `Google Maps: ${nombre}`,
      horario,
      tiempoEstimado: horario,
      tips: {
        llevar: String(
          input?.llevar || 'Calzado cómodo, agua y cámara.'
        ).trim(),
        mejorHorario: horario,
        dificultad: 'Fácil – Moderada',
      },
      resenas: [],
      desc,
      historia: '',
      actividades: '',
      imagen,
      mapEmbedUrl: '',
      mapsQuery: `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`,
      defaultSaved: false,
      esExperienciaHoy: true,
    };

    setPlaces((prev) => [newPlace, ...prev]);

    try {
      const created = await createPlace(newPlace);
      if (created && created.id) {
        setPlaces((prev) =>
          prev.map((item) =>
            item.id === newPlace.id ? { ...newPlace, ...created } : item
          )
        );
      }
      return { ok: true, place: created || newPlace };
    } catch {
      return { ok: true, place: newPlace };
    }
  };

  const editPlace = async (placeId, input) => {
    const nombre = String(input?.nombre || '').trim();
    const ubicacion = String(input?.ubicacion || '').trim();
    const desc = String(input?.desc || '').trim();
    const categoria = String(input?.categoria || 'Naturaleza').trim();

    if (!nombre || !ubicacion || !desc) {
      return {
        ok: false,
        error: 'Nombre, ubicación y descripción son obligatorios.',
      };
    }

    const distanciaCorta =
      String(input?.distanciaCorta || 'Centro').trim() || 'Centro';
    const altitudTexto =
      String(input?.altitudTexto || '2,625 m').trim() || '2,625 m';
    const precioTexto =
      String(input?.precioTexto || 'Libre').trim() || 'Libre';
    const horario =
      String(input?.horario || '8:00 am – 5:00 pm').trim() ||
      '8:00 am – 5:00 pm';
    const imagen =
      String(input?.imagen || '/images/celendin-hero.jpg').trim() ||
      '/images/celendin-hero.jpg';
    const llevar = String(
      input?.llevar || 'Calzado cómodo, agua y cámara.'
    ).trim();

    const patch = {
      nombre,
      ubicacion,
      direccionCorta: ubicacion,
      categoria,
      categoriaFiltro: categoria,
      distanciaCorta,
      distanciaGrid: distanciaCorta,
      distancia: `A ${distanciaCorta} de Celendín`,
      altitudTexto,
      precioTexto,
      horario,
      desc,
      imagen,
      tips: {
        llevar,
        mejorHorario: horario,
        dificultad: 'Fácil – Moderada',
      },
      mapsQuery: `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`,
    };

    editedPlacesRef.current[placeId] = patch;
    setPlaces((prev) =>
      prev.map((item) => (item.id === placeId ? { ...item, ...patch } : item))
    );

    updatePlace(placeId, patch).catch(() => {});
    return { ok: true };
  };

  const removePlace = async (placeId) => {
    deletedPlaceIdsRef.current.add(placeId);
    setPlaces((prev) => prev.filter((item) => item.id !== placeId));
    setSavedIds((prev) => {
      if (!prev.includes(placeId)) return prev;
      const next = prev.filter((id) => id !== placeId);
      persistProfilePatch({ savedPlaceIds: next });
      return next;
    });
    deletePlace(placeId).catch(() => {});
    return { ok: true };
  };

  const submitPlaceReview = async (placeId, rating, comentario, autor) => {
    const current = places.find((item) => item.id === placeId);
    if (current && Number(current.resenasCount ?? 0) >= MAX_REVIEWS_PER_ITEM) {
      return {
        ok: false,
        error: `Límite máximo de ${MAX_REVIEWS_PER_ITEM} reseñas alcanzado.`,
      };
    }

    const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const trimmedAuthor =
      (autor || 'Viajero Explorador').trim().slice(0, 35) || 'Viajero Explorador';
    const trimmedComment = (comentario || '').trim().slice(0, 180);
    const reviewEntry = trimmedComment
      ? {
          autor: trimmedAuthor,
          fecha: 'Reciente',
          rating: cleanRating,
          comentario: trimmedComment,
        }
      : null;

    setPlaces((prev) =>
      prev.map((item) => {
        if (item.id !== placeId) return item;
        const count = Number(item.resenasCount ?? 0);
        const prevSum = Number(item.ratingSum ?? Number(item.rating || 0) * count);
        const nextCount = count + 1;
        const nextSum = prevSum + cleanRating;
        return {
          ...item,
          resenasCount: nextCount,
          ratingSum: nextSum,
          rating: (nextSum / nextCount).toFixed(1),
          resenas: reviewEntry
            ? [reviewEntry, ...(item.resenas || [])].slice(0, MAX_REVIEWS_PER_ITEM)
            : item.resenas || [],
        };
      })
    );

    addPlaceReview(placeId, {
      rating: cleanRating,
      comentario: trimmedComment,
      autor: trimmedAuthor,
    }).catch(() => {});

    return { ok: true };
  };

  // ================= CRUD DE DIRECTORIO =================
  const addNewDirectoryItem = async (input) => {
    const nombre = String(input?.nombre || '').trim();
    const especialidad = String(input?.especialidad || '').trim();
    const direccion = String(input?.direccion || '').trim();
    const categoria = String(input?.categoria || 'Gastronomía').trim();

    if (!nombre || !especialidad || !direccion) {
      return {
        ok: false,
        error: 'Completa el nombre, especialidad y dirección.',
      };
    }

    const rawPhone = String(input?.telefono || '+51976579996').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const whatsapp =
      digitsOnly.length === 9 && digitsOnly.startsWith('9')
        ? `51${digitsOnly}`
        : digitsOnly || '51976579996';
    const telefono = rawPhone.startsWith('+') ? rawPhone : `+${whatsapp}`;
    const rangoPrecio =
      String(input?.rangoPrecio || 'S/ 15 - S/ 40').trim() || 'S/ 15 - S/ 40';
    const imagen =
      String(input?.imagen || '/images/chocolate-celendin.jpg').trim() ||
      '/images/chocolate-celendin.jpg';

    const newItem = {
      id: buildSlugId('dir', nombre),
      categoria,
      badge: categoria,
      rangoPrecio,
      nombre,
      verificado: true,
      rating: '0.0',
      ratingSum: 0,
      resenasCount: 0,
      especialidad,
      direccion,
      telefono,
      whatsapp,
      imagen,
    };

    setDirectoryItems((prev) => [newItem, ...prev]);

    try {
      const created = await createDirectoryItem(newItem);
      if (created && created.id) {
        setDirectoryItems((prev) =>
          prev.map((d) => (d.id === newItem.id ? { ...newItem, ...created } : d))
        );
      }
      return { ok: true, item: created || newItem };
    } catch {
      return { ok: true, item: newItem };
    }
  };

  const editDirectoryItem = async (itemId, input) => {
    const nombre = String(input?.nombre || '').trim();
    const especialidad = String(input?.especialidad || '').trim();
    const direccion = String(input?.direccion || '').trim();
    const categoria = String(input?.categoria || 'Gastronomía').trim();

    if (!nombre || !especialidad || !direccion) {
      return {
        ok: false,
        error: 'Nombre, especialidad y dirección son obligatorios.',
      };
    }

    const rawPhone = String(input?.telefono || '+51976579996').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const whatsapp =
      digitsOnly.length === 9 && digitsOnly.startsWith('9')
        ? `51${digitsOnly}`
        : digitsOnly || '51976579996';
    const telefono = rawPhone.startsWith('+') ? rawPhone : `+${whatsapp}`;
    const rangoPrecio =
      String(input?.rangoPrecio || 'S/ 15 - S/ 40').trim() || 'S/ 15 - S/ 40';
    const imagen =
      String(input?.imagen || '/images/chocolate-celendin.jpg').trim() ||
      '/images/chocolate-celendin.jpg';

    const patch = {
      nombre,
      categoria,
      badge: categoria,
      especialidad,
      direccion,
      rangoPrecio,
      telefono,
      whatsapp,
      imagen,
    };

    editedDirRef.current[itemId] = patch;
    setDirectoryItems((prev) =>
      prev.map((d) => (d.id === itemId ? { ...d, ...patch } : d))
    );

    updateDirectoryItem(itemId, patch).catch(() => {});
    return { ok: true };
  };

  const removeDirectoryItem = async (itemId) => {
    deletedDirIdsRef.current.add(itemId);
    setDirectoryItems((prev) => prev.filter((d) => d.id !== itemId));
    deleteDirectoryItem(itemId).catch(() => {});
    return { ok: true };
  };

  const rateDirectoryItem = async (itemId, stars) => {
    setDirectoryItems((prev) =>
      prev.map((d) => {
        if (d.id !== itemId) return d;
        const count = Number(d.resenasCount ?? 0);
        const prevSum = Number(d.ratingSum ?? Number(d.rating || 0) * count);
        const nextCount = count + 1;
        const nextSum = prevSum + stars;
        return {
          ...d,
          resenasCount: nextCount,
          ratingSum: nextSum,
          rating: (nextSum / nextCount).toFixed(1),
        };
      })
    );
    addDirectoryReview(itemId, { rating: stars }).catch(() => {});
  };

  // ================= CRUD DE PERFIL (EMERGENCIAS Y TRANSPORTE) =================
  const addEmergencyNumber = (input) => {
    const titulo = String(input?.titulo || '').trim();
    const numero = String(input?.numero || '').trim();
    const detalle = String(input?.detalle || '').trim();
    if (!titulo || !numero) {
      return {
        ok: false,
        error: 'El nombre de la institución y el teléfono son obligatorios.',
      };
    }
    const tel = numero.replace(/\D/g, '') || numero;
    const newEntry = {
      id: buildSlugId('sos', titulo),
      titulo,
      numero,
      tel,
      detalle: detalle || 'Atención de emergencias en Celendín',
    };
    setEmergencyNumbers((prev) => [newEntry, ...prev]);
    return { ok: true, item: newEntry };
  };

  const editEmergencyNumber = (id, input) => {
    const titulo = String(input?.titulo || '').trim();
    const numero = String(input?.numero || '').trim();
    const detalle = String(input?.detalle || '').trim();
    if (!titulo || !numero) {
      return {
        ok: false,
        error: 'El nombre de la institución y el teléfono son obligatorios.',
      };
    }
    const tel = numero.replace(/\D/g, '') || numero;
    setEmergencyNumbers((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              titulo,
              numero,
              tel,
              detalle: detalle || item.detalle,
            }
          : item
      )
    );
    return { ok: true };
  };

  const removeEmergencyNumber = (id) => {
    setEmergencyNumbers((prev) => prev.filter((item) => item.id !== id));
    return { ok: true };
  };

  const addBusAgency = (input) => {
    const empresa = String(input?.empresa || '').trim();
    const ruta = String(input?.ruta || '').trim();
    const terminal = String(input?.terminal || '').trim();
    const tipo =
      input?.tipo === 'combis' || input?.tipo === 'autos'
        ? input.tipo
        : 'buses';
    if (!empresa || !ruta || !terminal) {
      return {
        ok: false,
        error: 'Completa el nombre de la agencia, ruta y dirección.',
      };
    }
    const newBus = {
      id: buildSlugId('bus', empresa),
      tipo,
      empresa,
      ruta,
      terminal,
    };
    setBusAgencies((prev) => [newBus, ...prev]);
    return { ok: true, item: newBus };
  };

  const editBusAgency = (id, input) => {
    const empresa = String(input?.empresa || '').trim();
    const ruta = String(input?.ruta || '').trim();
    const terminal = String(input?.terminal || '').trim();
    const tipo =
      input?.tipo === 'combis' || input?.tipo === 'autos'
        ? input.tipo
        : 'buses';
    if (!empresa || !ruta || !terminal) {
      return {
        ok: false,
        error: 'Completa el nombre de la agencia, ruta y dirección.',
      };
    }
    setBusAgencies((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, tipo, empresa, ruta, terminal } : item
      )
    );
    return { ok: true };
  };

  const removeBusAgency = (id) => {
    setBusAgencies((prev) => prev.filter((item) => item.id !== id));
    return { ok: true };
  };

  const savedPlaces = useMemo(
    () => places.filter((p) => savedIds.includes(p.id)),
    [places, savedIds]
  );

  const value = useMemo(
    () => ({
      places,
      directoryItems,
      homeBanners,
      emergencyNumbers,
      busAgencies,
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
      adminVisible,
      setAdminVisible,
      adminInitialTab,
      openAdminPanel,
      syncPlaces,
      toggleSaved,
      submitPlaceReview,
      addHomeBanner,
      editHomeBanner,
      removeHomeBanner,
      addNewPlace,
      editPlace,
      removePlace,
      addNewDirectoryItem,
      editDirectoryItem,
      removeDirectoryItem,
      rateDirectoryItem,
      addEmergencyNumber,
      editEmergencyNumber,
      removeEmergencyNumber,
      addBusAgency,
      editBusAgency,
      removeBusAgency,
      isSaved: (id) => savedIds.includes(id),
    }),
    [
      places,
      directoryItems,
      homeBanners,
      emergencyNumbers,
      busAgencies,
      savedIds,
      savedPlaces,
      refreshing,
      showWelcome,
      darkMode,
      language,
      offlineReady,
      adminVisible,
      adminInitialTab,
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
