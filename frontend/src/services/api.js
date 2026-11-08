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

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
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
