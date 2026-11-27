import { Linking } from 'react-native';
import placesFromDataJs from './placesData.json';
import { getImageUrl } from '../services/api';

export const IMAGE_PRESETS = [];

export function hasCustomUploadedImage(itemOrPath) {
  const src = getPlaceImageSource(itemOrPath);
  return Boolean(src && src.uri);
}

export function getPlaceImageSource(itemOrPath) {
  const path =
    typeof itemOrPath === 'string' ? itemOrPath : itemOrPath?.imagen;

  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed.startsWith('/images/')) {
    return null;
  }
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('blob:')
  ) {
    return { uri: trimmed };
  }
  const remoteUri = getImageUrl(trimmed);
  return remoteUri ? { uri: remoteUri } : null;
}

export function extractIframeSrc(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const texto = raw.trim();
  const srcMatch = texto.match(/src=["']([^"']+)["']/i);
  const candidate = srcMatch ? srcMatch[1].trim() : texto;

  // Si pega un iframe embed oficial de Google Maps
  if (/google\.com\/maps\/embed/i.test(candidate) || /output=embed/i.test(candidate)) {
    return candidate;
  }

  // Si pega un enlace de Google Maps con coordenadas @lat,lng
  const atCoords = candidate.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atCoords) {
    return `https://maps.google.com/maps?q=${atCoords[1]},${atCoords[2]}&z=15&output=embed`;
  }

  // Si pega un enlace de Google Maps con ?q= o query=
  const qMatch = candidate.match(/[?&](?:q|query|destination)=([^&]+)/i);
  if (qMatch) {
    return `https://maps.google.com/maps?q=${qMatch[1]}&z=15&output=embed`;
  }

  // Si pega un enlace de Google Maps /maps/place/Nombre/...
  const placeMatch = candidate.match(/google\.[^/]+\/maps\/place\/([^/?#]+)/i);
  if (placeMatch) {
    return `https://maps.google.com/maps?q=${placeMatch[1]}&z=15&output=embed`;
  }

  // Si es una URL https válida (por ejemplo maps.google.com/maps?...)
  if (/^https?:\/\//i.test(candidate)) {
    if (/google\.[^/]+\/maps/i.test(candidate) && !candidate.includes('output=embed')) {
      const sep = candidate.includes('?') ? '&' : '?';
      return `${candidate}${sep}output=embed`;
    }
    return candidate;
  }

  // Si escribió una dirección o nombre directamente en el campo de mapa
  return `https://maps.google.com/maps?q=${encodeURIComponent(candidate)}&z=15&output=embed`;
}

export function getGoogleMapsEmbedUrl(item) {
  const customEmbed = extractIframeSrc(item?.mapEmbedUrl);
  if (customEmbed) return customEmbed;
  const latNum = Number(item?.lat);
  const lngNum = Number(item?.lng);
  if (
    item?.lat !== '' &&
    item?.lat != null &&
    item?.lng !== '' &&
    item?.lng != null &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum)
  ) {
    return `https://maps.google.com/maps?q=${latNum},${lngNum}&z=15&output=embed`;
  }
  const query = encodeURIComponent(
    item?.mapsQuery ||
      `${item?.nombre || 'Celendín'}, ${item?.ubicacion || 'Celendín'}, Cajamarca, Perú`
  );
  return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
}

export function buildMapIframeHtml(embedSrc) {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: #F4F6F5; overflow: hidden; }
          iframe { width: 100%; height: 100%; border: 0; }
        </style>
      </head>
      <body>
        <iframe
          src="${embedSrc}"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </body>
    </html>`;
}

export function openGoogleMapsLocation(item) {
  if (!item) return;
  const query =
    item.lat && item.lng
      ? `${item.lat},${item.lng}`
      : encodeURIComponent(
          item.mapsQuery || `${item.nombre}, Celendín, Cajamarca, Perú`
        );
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

export function openGoogleMapsRoute(item) {
  if (!item) return;
  const dest =
    item.lat && item.lng
      ? `${item.lat},${item.lng}`
      : encodeURIComponent(
          item.mapsQuery || `${item.nombre}, Celendín, Cajamarca, Perú`
        );
  Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
  );
}

const DEFAULT_PLACES_BASE = placesFromDataJs;

export function getStarIconNames(ratingValue) {
  const num = Math.max(0, Math.min(5, Number(ratingValue) || 0));
  return [1, 2, 3, 4, 5].map((star) => {
    if (num >= star) return 'star';
    if (num >= star - 0.5) return 'star-half';
    return 'star-outline';
  });
}

// La base de datos es la fuente de verdad: los datos remotos reemplazan a los
// locales. El catálogo local solo completa campos que falten (coordenadas, mapa).
export function mergeWithCatalog(remotePlaces, currentPlaces = []) {
  if (!Array.isArray(remotePlaces) || remotePlaces.length === 0) {
    return Array.isArray(currentPlaces) && currentPlaces.length > 0
      ? currentPlaces
      : DEFAULT_PLACES_BASE;
  }

  return remotePlaces
    .filter((r) => r && r.nombre)
    .map((r) => {
      const id = r.id || r._id;
      const base = DEFAULT_PLACES_BASE.find((b) => b.id === id) || {};
      const cleanImagen =
        typeof r.imagen === 'string' && !r.imagen.startsWith('/images/')
          ? r.imagen
          : '';
      return {
        ...base,
        ...r,
        id,
        imagen: cleanImagen,
        imagenUrl: cleanImagen ? r.imagenUrl : '',
        lat: r.lat ?? base.lat,
        lng: r.lng ?? base.lng,
        mapEmbedUrl: r.mapEmbedUrl || base.mapEmbedUrl || '',
        rating: r.rating ?? '0.0',
        ratingSum: typeof r.ratingSum === 'number' ? r.ratingSum : 0,
        resenasCount: typeof r.resenasCount === 'number' ? r.resenasCount : 0,
        resenas: Array.isArray(r.resenas) ? r.resenas : [],
        tips: {
          llevar: 'Calzado cómodo, agua y cámara.',
          mejorHorario: r.horario || '8:00 am – 5:00 pm',
          dificultad: 'Fácil – Moderada',
          ...(base.tips || {}),
          ...(r.tips || {}),
        },
      };
    });
}

export function normalizePlace(remote) {
  return mergeWithCatalog([remote])[0];
}

export function getInitialPlacesCatalog() {
  return DEFAULT_PLACES_BASE;
}
