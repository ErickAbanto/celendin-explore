import { Linking } from 'react-native';
import placesFromDataJs from './placesData.json';
import { getImageUrl } from '../services/api';

const LOCAL_IMAGES = {
  '/images/catarata-cornelio.jpg': require('../../assets/images/catarata-cornelio.jpg'),
  '/images/celendin-hero.jpg': require('../../assets/images/celendin-hero.jpg'),
  '/images/chocolate-celendin.jpg': require('../../assets/images/chocolate-celendin.jpg'),
  '/images/mirador-san-isidro.jpg': require('../../assets/images/mirador-san-isidro.jpg'),
  '/images/plaza-armas.jpg': require('../../assets/images/plaza-armas.jpg'),
  '/images/sombrero-shilico.jpg': require('../../assets/images/sombrero-shilico.jpg'),
};

export function getPlaceImageSource(itemOrPath) {
  const path =
    typeof itemOrPath === 'string' ? itemOrPath : itemOrPath?.imagen;

  if (path && LOCAL_IMAGES[path]) {
    return LOCAL_IMAGES[path];
  }
  const remoteUri =
    typeof itemOrPath === 'object' && itemOrPath?.imagenUrl
      ? itemOrPath.imagenUrl
      : getImageUrl(path);
  return { uri: remoteUri };
}

export function extractIframeSrc(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  const texto = raw.trim();
  const srcMatch = texto.match(/src=["']([^"']+)["']/i);
  return srcMatch ? srcMatch[1] : texto;
}

export function getGoogleMapsEmbedUrl(item) {
  const customEmbed = extractIframeSrc(item?.mapEmbedUrl);
  if (customEmbed) return customEmbed;
  if (item?.lat && item?.lng) {
    return `https://maps.google.com/maps?q=${item.lat},${item.lng}&z=15&output=embed`;
  }
  const query = encodeURIComponent(
    item?.mapsQuery || `${item?.nombre || 'Celendín'}, Celendín, Cajamarca, Perú`
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

export function mergeWithCatalog(remotePlaces) {
  if (!Array.isArray(remotePlaces) || remotePlaces.length === 0) {
    return DEFAULT_PLACES_BASE;
  }

  return DEFAULT_PLACES_BASE.map((baseItem) => {
    const match =
      remotePlaces.find((r) => r.id && r.id === baseItem.id) ||
      remotePlaces.find((r) => r.nombre === baseItem.nombre) ||
      remotePlaces.find((r) => r.imagen === baseItem.imagen);

    if (!match) return baseItem;
    return {
      ...baseItem,
      ...match,
      id: match.id || baseItem.id,
      _id: match._id || baseItem.id,
      tips: match.tips?.llevar ? match.tips : baseItem.tips,
      resenas: Array.isArray(match.resenas) ? match.resenas : baseItem.resenas,
      resenasCount:
        typeof match.resenasCount === 'number'
          ? match.resenasCount
          : baseItem.resenasCount ?? 0,
      ratingSum:
        typeof match.ratingSum === 'number'
          ? match.ratingSum
          : baseItem.ratingSum ?? 0,
      rating: match.rating ?? baseItem.rating ?? '0.0',
      mapEmbedUrl: match.mapEmbedUrl || baseItem.mapEmbedUrl || '',
      imagenUrl: match.imagenUrl || baseItem.imagenUrl,
    };
  });
}

export function getInitialPlacesCatalog() {
  return DEFAULT_PLACES_BASE;
}
