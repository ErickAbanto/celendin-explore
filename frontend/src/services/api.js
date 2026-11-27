// URL pública en Render conectada directamente a MongoDB Atlas en la nube
const RENDER_URL = 'https://celendin-explore.onrender.com';

export const API_URL =
  (process.env.EXPO_PUBLIC_API_URL || RENDER_URL).trim() || RENDER_URL;

// Construye la URL completa HTTPS o Data URI de una imagen subida en la BD
export function getImageUrl(imagenPathOrUrl) {
  if (!imagenPathOrUrl || typeof imagenPathOrUrl !== 'string') return '';
  const trimmed = imagenPathOrUrl.trim();
  if (!trimmed || trimmed.startsWith('/images/')) return '';
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('http://celendin-explore.onrender.com')) {
    if (trimmed.includes('/images/')) return '';
    return trimmed.replace('http://', 'https://');
  }
  if (trimmed.startsWith('https://celendin-explore.onrender.com/images/')) {
    return '';
  }
  if (trimmed.startsWith('http')) return trimmed;
  return `${API_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(payload?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = payload;
      throw err;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export const getPlaces = () => request('/places');
export const getDirectory = () => request('/directory');
export const getCulture = () => request('/culture');
export const getGalleryImages = () => request('/images');

export const createPlace = (place) =>
  request('/places', {
    method: 'POST',
    body: JSON.stringify(place),
  });

export const updatePlace = (placeId, place) =>
  request(`/places/${encodeURIComponent(placeId)}`, {
    method: 'PUT',
    body: JSON.stringify(place),
  });

export const deletePlace = (placeId) =>
  request(`/places/${encodeURIComponent(placeId)}`, {
    method: 'DELETE',
  });

export const createDirectoryItem = (item) =>
  request('/directory', {
    method: 'POST',
    body: JSON.stringify(item),
  });

export const updateDirectoryItem = (itemId, item) =>
  request(`/directory/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });

export const deleteDirectoryItem = (itemId) =>
  request(`/directory/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });

export const addPlaceReview = (placeId, review) =>
  request(`/places/${encodeURIComponent(placeId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });

export const addDirectoryReview = (itemId, review) =>
  request(`/directory/${encodeURIComponent(itemId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });

export const getProfile = (deviceId = 'explorador-shilico') =>
  request(`/profile/${encodeURIComponent(deviceId)}`);

// CRUD genérico para colecciones simples (Inicio, Emergencias, Transporte)
function buildCrud(resource) {
  return {
    list: () => request(`/${resource}`),
    create: (item) =>
      request(`/${resource}`, { method: 'POST', body: JSON.stringify(item) }),
    update: (id, item) =>
      request(`/${resource}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      }),
    remove: (id) =>
      request(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

export const bannersApi = buildCrud('banners');
export const emergenciesApi = buildCrud('emergencies');
export const transportApi = buildCrud('transport');

export const saveProfile = (deviceId = 'explorador-shilico', payload = {}) =>
  request(`/profile/${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
