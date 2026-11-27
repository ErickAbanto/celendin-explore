// URL pública en Render conectada a MongoDB Atlas (funciona desde cualquier red o datos móviles)
const RENDER_URL = 'https://celendin-explore.onrender.com';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || RENDER_URL;

// Construye la URL completa HTTPS de una imagen alojada en el backend (/images/...)
export function getImageUrl(imagenPathOrUrl) {
  if (!imagenPathOrUrl) return `${API_URL}/images/celendin-hero.jpg`;
  if (imagenPathOrUrl.startsWith('http://celendin-explore.onrender.com')) {
    return imagenPathOrUrl.replace('http://', 'https://');
  }
  if (imagenPathOrUrl.startsWith('http')) return imagenPathOrUrl;
  return `${API_URL}${imagenPathOrUrl.startsWith('/') ? '' : '/'}${imagenPathOrUrl}`;
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

export const saveProfile = (deviceId = 'explorador-shilico', payload = {}) =>
  request(`/profile/${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
