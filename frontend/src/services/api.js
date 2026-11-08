import Constants from 'expo-constants';

// URL del Backend: usa EXPO_PUBLIC_API_URL si existe; si no, toma la IP de la PC
// desde la que Expo sirve la app y el puerto 3000.
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:3000`;
}

export const API_URL = resolveBaseUrl();

// Construye la URL completa de una imagen alojada en el backend (/images/...)
export function getImageUrl(imagenPathOrUrl) {
  if (!imagenPathOrUrl) return `${API_URL}/images/celendin-hero.jpg`;
  if (imagenPathOrUrl.startsWith('http')) return imagenPathOrUrl;
  return `${API_URL}${imagenPathOrUrl.startsWith('/') ? '' : '/'}${imagenPathOrUrl}`;
}

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${API_URL}/api${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const getPlaces = () => request('/places');
export const getCulture = () => request('/culture');
export const getGalleryImages = () => request('/images');
