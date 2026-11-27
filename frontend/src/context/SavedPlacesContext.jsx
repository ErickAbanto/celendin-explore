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
  bannersApi,
  createDirectoryItem,
  createPlace,
  deleteDirectoryItem,
  deletePlace,
  emergenciesApi,
  getDirectory,
  getPlaces,
  getProfile,
  saveProfile,
  transportApi,
  updateDirectoryItem,
  updatePlace,
} from '../services/api';
import {
  getInitialPlacesCatalog,
  mergeWithCatalog,
  normalizePlace,
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
    imagen: '',
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
    imagen: '',
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
    imagen: '',
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
    imagen: '',
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
    imagen: '',
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
    imagen: '',
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

// Respuesta estándar cuando la base de datos no confirma el guardado
function dbError(e) {
  const detail = e?.message ? ` (${e.message})` : '';
  return {
    ok: false,
    error: `No se pudo guardar en la base de datos${detail}. Verifica tu conexión a internet e inténtalo de nuevo.`,
  };
}

function normalizeDirectoryItem(item) {
  const cleanImagen =
    typeof item.imagen === 'string' && !item.imagen.startsWith('/images/')
      ? item.imagen
      : '';
  return {
    ...item,
    id: item.id || item._id,
    imagen: cleanImagen,
    imagenUrl: cleanImagen ? item.imagenUrl : '',
    rating: item.rating ?? '0.0',
    ratingSum: typeof item.ratingSum === 'number' ? item.ratingSum : 0,
    resenasCount: typeof item.resenasCount === 'number' ? item.resenasCount : 0,
  };
}

const hasItems = (result) =>
  result.status === 'fulfilled' &&
  Array.isArray(result.value) &&
  result.value.length > 0;

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
  const [adminInitialTab, setAdminInitialTab] = useState('places');

  const deletedPlaceIdsRef = useRef(new Set());
  const deletedDirIdsRef = useRef(new Set());

  const openAdminPanel = (tab = 'places') => {
    const safeTab =
      tab === 'places' || tab === 'directory' || tab === 'perfil'
        ? tab
        : 'places';
    setAdminInitialTab(safeTab);
    setAdminVisible(true);
  };

  // La base de datos (MongoDB) es la fuente de verdad de toda la información
  const syncPlaces = async () => {
    setRefreshing(true);
    try {
      const [placesRes, dirRes, profileRes, bannersRes, sosRes, transportRes] =
        await Promise.allSettled([
          getPlaces(),
          getDirectory(),
          getProfile(DEVICE_ID),
          bannersApi.list(),
          emergenciesApi.list(),
          transportApi.list(),
        ]);

      if (hasItems(placesRes)) {
        setPlaces((prev) =>
          mergeWithCatalog(placesRes.value, prev).filter(
            (p) => !deletedPlaceIdsRef.current.has(p.id)
          )
        );
      }

      if (hasItems(dirRes)) {
        const cleanDir = dirRes.value
          .filter(
            (item) =>
              item &&
              item.nombre &&
              !LEGACY_FICTITIOUS_DIR_IDS.has(item.id) &&
              !deletedDirIdsRef.current.has(item.id)
          )
          .map(normalizeDirectoryItem);
        if (cleanDir.length > 0) setDirectoryItems(cleanDir);
      }

      if (hasItems(bannersRes)) setHomeBanners(bannersRes.value);
      if (hasItems(sosRes)) setEmergencyNumbers(sosRes.value);
      if (hasItems(transportRes)) setBusAgencies(transportRes.value);

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
  const buildBannerPayload = (input) => ({
    etiqueta: (
      String(input?.etiqueta || 'DESTACADO EN INICIO').trim() ||
      'DESTACADO EN INICIO'
    ).toUpperCase(),
    titulo: String(input?.titulo || '').trim(),
    subtitulo: String(input?.subtitulo || '').trim(),
    destino:
      input?.destino === 'Lugares' || input?.destino === 'Perfil / Offline'
        ? input.destino
        : 'Directorio',
  });

  const addHomeBanner = async (input) => {
    const payload = buildBannerPayload(input);
    if (!payload.titulo) {
      return { ok: false, error: 'El título del bloque de Inicio es obligatorio.' };
    }
    try {
      const created = await bannersApi.create({
        ...payload,
        id: buildSlugId('home', payload.titulo),
      });
      setHomeBanners((prev) => [...prev, created]);
      return { ok: true, item: created };
    } catch (e) {
      return dbError(e);
    }
  };

  const editHomeBanner = async (bannerId, input) => {
    const payload = buildBannerPayload(input);
    if (!payload.titulo) {
      return { ok: false, error: 'El título del bloque de Inicio es obligatorio.' };
    }
    try {
      const updated = await bannersApi.update(bannerId, payload);
      setHomeBanners((prev) =>
        prev.map((b) => (b.id === bannerId ? { ...b, ...updated } : b))
      );
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const removeHomeBanner = async (bannerId) => {
    try {
      await bannersApi.remove(bannerId);
      setHomeBanners((prev) => prev.filter((b) => b.id !== bannerId));
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
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

    const direccionCorta =
      String(input?.direccionCorta || ubicacion).trim() || ubicacion;
    const distanciaCorta =
      String(input?.distanciaCorta || 'Centro').trim() || 'Centro';
    const altitudTexto =
      String(input?.altitudTexto || '2,625 m').trim() || '2,625 m';
    const precioTexto =
      String(input?.precioTexto || 'Libre').trim() || 'Libre';
    const horario =
      String(input?.horario || '8:00 am – 5:00 pm').trim() ||
      '8:00 am – 5:00 pm';
    const tiempoEstimado =
      String(input?.tiempoEstimado || '').trim() || horario;
    const llevar =
      String(input?.llevar || 'Calzado cómodo, agua y cámara.').trim() ||
      'Calzado cómodo, agua y cámara.';
    const mejorHorario =
      String(input?.mejorHorario || horario).trim() || horario;
    const dificultad =
      String(input?.dificultad || 'Fácil – Moderada').trim() ||
      'Fácil – Moderada';
    const imagen = String(input?.imagen || '').trim();
    const mapEmbedUrl = String(input?.mapEmbedUrl || '').trim();
    const mapsQuery =
      String(input?.mapsQuery || '').trim() ||
      `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`;

    const newPlace = {
      id: buildSlugId('lugar', nombre),
      nombre,
      ubicacion,
      direccionCorta,
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
      tiempoEstimado,
      tips: {
        llevar,
        mejorHorario,
        dificultad,
      },
      resenas: [],
      desc,
      historia: '',
      actividades: '',
      imagen,
      mapEmbedUrl,
      mapsQuery,
      defaultSaved: false,
      esExperienciaHoy: true,
    };

    try {
      const created = await createPlace(newPlace);
      const saved = normalizePlace({ ...newPlace, ...(created || {}) });
      setPlaces((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      syncPlaces();
      return { ok: true, place: saved };
    } catch (e) {
      return dbError(e);
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

    const direccionCorta =
      String(input?.direccionCorta || ubicacion).trim() || ubicacion;
    const distanciaCorta =
      String(input?.distanciaCorta || 'Centro').trim() || 'Centro';
    const altitudTexto =
      String(input?.altitudTexto || '2,625 m').trim() || '2,625 m';
    const precioTexto =
      String(input?.precioTexto || 'Libre').trim() || 'Libre';
    const horario =
      String(input?.horario || '8:00 am – 5:00 pm').trim() ||
      '8:00 am – 5:00 pm';
    const tiempoEstimado = String(input?.tiempoEstimado || '').trim();
    const imagen = String(input?.imagen || '').trim();
    const llevar =
      String(input?.llevar || 'Calzado cómodo, agua y cámara.').trim() ||
      'Calzado cómodo, agua y cámara.';
    const mejorHorario =
      String(input?.mejorHorario || horario).trim() || horario;
    const dificultad =
      String(input?.dificultad || 'Fácil – Moderada').trim() ||
      'Fácil – Moderada';
    const mapEmbedUrl = String(input?.mapEmbedUrl || '').trim();
    const mapsQuery =
      String(input?.mapsQuery || '').trim() ||
      `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`;

    const patch = {
      nombre,
      ubicacion,
      direccionCorta,
      categoria,
      categoriaFiltro: categoria,
      distanciaCorta,
      distanciaGrid: distanciaCorta,
      distancia: `A ${distanciaCorta} de Celendín`,
      altitudTexto,
      precioTexto,
      horario,
      tiempoEstimado,
      desc,
      imagen,
      mapEmbedUrl,
      tips: {
        llevar,
        mejorHorario,
        dificultad,
      },
      mapsQuery,
    };

    try {
      const updated = await updatePlace(placeId, patch);
      setPlaces((prev) =>
        prev.map((item) =>
          item.id === placeId
            ? normalizePlace({ ...item, ...patch, ...(updated || {}) })
            : item
        )
      );
      syncPlaces();
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const removePlace = async (placeId) => {
    try {
      await deletePlace(placeId);
    } catch (e) {
      return dbError(e);
    }
    deletedPlaceIdsRef.current.add(placeId);
    setPlaces((prev) => prev.filter((item) => item.id !== placeId));
    setSavedIds((prev) => {
      if (!prev.includes(placeId)) return prev;
      const next = prev.filter((id) => id !== placeId);
      persistProfilePatch({ savedPlaceIds: next });
      return next;
    });
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
    const imagen = String(input?.imagen || '').trim();

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

    try {
      const created = await createDirectoryItem(newItem);
      const saved = normalizeDirectoryItem({ ...newItem, ...(created || {}) });
      setDirectoryItems((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      syncPlaces();
      return { ok: true, item: saved };
    } catch (e) {
      return dbError(e);
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
    const imagen = String(input?.imagen || '').trim();

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

    try {
      const updated = await updateDirectoryItem(itemId, patch);
      setDirectoryItems((prev) =>
        prev.map((d) =>
          d.id === itemId
            ? normalizeDirectoryItem({ ...d, ...patch, ...(updated || {}) })
            : d
        )
      );
      syncPlaces();
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const removeDirectoryItem = async (itemId) => {
    try {
      await deleteDirectoryItem(itemId);
    } catch (e) {
      return dbError(e);
    }
    deletedDirIdsRef.current.add(itemId);
    setDirectoryItems((prev) => prev.filter((d) => d.id !== itemId));
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
  const buildSosPayload = (input) => {
    const numero = String(input?.numero || '').trim();
    return {
      titulo: String(input?.titulo || '').trim(),
      numero,
      tel: numero.replace(/\D/g, '') || numero,
      detalle:
        String(input?.detalle || '').trim() ||
        'Atención de emergencias en Celendín',
    };
  };

  const SOS_REQUIRED_ERROR = {
    ok: false,
    error: 'El nombre de la institución y el teléfono son obligatorios.',
  };

  const addEmergencyNumber = async (input) => {
    const payload = buildSosPayload(input);
    if (!payload.titulo || !payload.numero) return SOS_REQUIRED_ERROR;
    try {
      const created = await emergenciesApi.create({
        ...payload,
        id: buildSlugId('sos', payload.titulo),
      });
      setEmergencyNumbers((prev) => [...prev, created]);
      return { ok: true, item: created };
    } catch (e) {
      return dbError(e);
    }
  };

  const editEmergencyNumber = async (id, input) => {
    const payload = buildSosPayload(input);
    if (!payload.titulo || !payload.numero) return SOS_REQUIRED_ERROR;
    try {
      const updated = await emergenciesApi.update(id, payload);
      setEmergencyNumbers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
      );
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const removeEmergencyNumber = async (id) => {
    try {
      await emergenciesApi.remove(id);
      setEmergencyNumbers((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const buildBusPayload = (input) => ({
    tipo:
      input?.tipo === 'combis' || input?.tipo === 'autos' ? input.tipo : 'buses',
    empresa: String(input?.empresa || '').trim(),
    ruta: String(input?.ruta || '').trim(),
    terminal: String(input?.terminal || '').trim(),
  });

  const BUS_REQUIRED_ERROR = {
    ok: false,
    error: 'Completa el nombre de la agencia, ruta y dirección.',
  };

  const addBusAgency = async (input) => {
    const payload = buildBusPayload(input);
    if (!payload.empresa || !payload.ruta || !payload.terminal) {
      return BUS_REQUIRED_ERROR;
    }
    try {
      const created = await transportApi.create({
        ...payload,
        id: buildSlugId('bus', payload.empresa),
      });
      setBusAgencies((prev) => [...prev, created]);
      return { ok: true, item: created };
    } catch (e) {
      return dbError(e);
    }
  };

  const editBusAgency = async (id, input) => {
    const payload = buildBusPayload(input);
    if (!payload.empresa || !payload.ruta || !payload.terminal) {
      return BUS_REQUIRED_ERROR;
    }
    try {
      const updated = await transportApi.update(id, payload);
      setBusAgencies((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
      );
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
  };

  const removeBusAgency = async (id) => {
    try {
      await transportApi.remove(id);
      setBusAgencies((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    } catch (e) {
      return dbError(e);
    }
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
