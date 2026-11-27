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

export const IMAGE_PRESETS = [
  {
    key: '/images/celendin-hero.jpg',
    labelEs: 'Panorámica',
    labelEn: 'Panorama',
  },
  {
    key: '/images/catarata-cornelio.jpg',
    labelEs: 'Naturaleza',
    labelEn: 'Nature',
  },
  {
    key: '/images/plaza-armas.jpg',
    labelEs: 'Centro / Plaza',
    labelEn: 'Main Square',
  },
  {
    key: '/images/mirador-san-isidro.jpg',
    labelEs: 'Mirador',
    labelEn: 'Viewpoint',
  },
  {
    key: '/images/sombrero-shilico.jpg',
    labelEs: 'Artesanía',
    labelEn: 'Crafts',
  },
  {
    key: '/images/chocolate-celendin.jpg',
    labelEs: 'Gastronomía',
    labelEn: 'Gastronomy',
  },
];

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

export function getStarIconNames(ratingValue) {
  const num = Math.max(0, Math.min(5, Number(ratingValue) || 0));
  return [1, 2, 3, 4, 5].map((star) => {
    if (num >= star) return 'star';
    if (num >= star - 0.5) return 'star-half';
    return 'star-outline';
  });
}

export function mergeWithCatalog(remotePlaces, currentPlaces = []) {
  if (!Array.isArray(remotePlaces) || remotePlaces.length === 0) {
    return Array.isArray(currentPlaces) && currentPlaces.length > 0
      ? currentPlaces
      : DEFAULT_PLACES_BASE;
  }

  const matchedIds = new Set();
  const matchedNames = new Set();

  const baseMerged = DEFAULT_PLACES_BASE.map((baseItem) => {
    const localCur = (Array.isArray(currentPlaces) ? currentPlaces : []).find(
      (c) => c.id === baseItem.id
    );
    const match =
      remotePlaces.find((r) => r.id && r.id === baseItem.id) ||
      remotePlaces.find((r) => r.nombre === baseItem.nombre);

    if (match?.id) matchedIds.add(match.id);
    if (match?.nombre) matchedNames.add(match.nombre);

    const hasLocalVotes = (localCur?.resenasCount ?? 0) > 0;

    return {
      ...baseItem,
      id: baseItem.id,
      _id: match?._id || baseItem.id,
      resenas: hasLocalVotes ? localCur.resenas : [],
      resenasCount: hasLocalVotes ? localCur.resenasCount : 0,
      ratingSum: hasLocalVotes ? localCur.ratingSum : 0,
      rating: hasLocalVotes ? localCur.rating : '0.0',
      mapEmbedUrl: baseItem.mapEmbedUrl || match?.mapEmbedUrl || '',
      imagenUrl: match?.imagenUrl || baseItem.imagenUrl,
    };
  });

  DEFAULT_PLACES_BASE.forEach((b) => {
    if (b.id) matchedIds.add(b.id);
    if (b.nombre) matchedNames.add(b.nombre);
  });

  const extraRemote = remotePlaces
    .filter(
      (r) =>
        r &&
        r.nombre &&
        !(r.id && matchedIds.has(r.id)) &&
        !matchedNames.has(r.nombre)
    )
    .map((r) => {
      if (r.id) matchedIds.add(r.id);
      if (r.nombre) matchedNames.add(r.nombre);
      return {
        ...r,
        id: r.id || r._id || `lugar-${Date.now()}`,
        rating: r.rating ?? '0.0',
        ratingSum: typeof r.ratingSum === 'number' ? r.ratingSum : 0,
        resenasCount: typeof r.resenasCount === 'number' ? r.resenasCount : 0,
        resenas: Array.isArray(r.resenas) ? r.resenas : [],
        tips: r.tips || {
          llevar: 'Calzado cómodo, agua y protección solar.',
          mejorHorario: r.horario || '8:00 am – 5:00 pm',
          dificultad: 'Fácil – Moderada.',
        },
      };
    });

  const extraLocal = (Array.isArray(currentPlaces) ? currentPlaces : []).filter(
    (localItem) =>
      localItem &&
      localItem.nombre &&
      !(localItem.id && matchedIds.has(localItem.id)) &&
      !matchedNames.has(localItem.nombre)
  );

  return [...baseMerged, ...extraRemote, ...extraLocal];
}

export function getInitialPlacesCatalog() {
  return DEFAULT_PLACES_BASE;
}
