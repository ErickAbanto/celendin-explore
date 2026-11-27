require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const {
  Place,
  DirectoryItem,
  UserProfile,
  Culture,
  GalleryImage,
  HomeBanner,
  EmergencyNumber,
  TransportAgency,
  AppMeta,
} = require('./models');
const {
  places,
  directory,
  culture,
  gallery,
  defaultProfile,
} = require('./data');
const {
  homeBanners: seedHomeBanners,
  emergencyNumbers: seedEmergencyNumbers,
  transportAgencies: seedTransportAgencies,
  legacyDirectoryIds,
} = require('./seedExtras');

// Longitud máxima para imágenes subidas en base64 (data:image/...) o links guardados en MongoDB Atlas
const MAX_IMAGE_URL_LENGTH = 800000;

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Carpeta pública de imágenes servidas desde el backend: http://<host>:3000/images/<archivo>.jpg
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Límites anti-spam y protección para MongoDB Atlas Free Tier (512 MB)
const MAX_REVIEWS_PER_ITEM = 20;
const MAX_PLACES_FREE_TIER = 60;
const MAX_DIRECTORY_FREE_TIER = 60;
const MAX_PROFILES_FREE_TIER = 1000;
const REVIEW_COOLDOWN_MS = 3000;
const recentReviewsByIp = new Map();

function slugifyId(prefix, text) {
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

let mongoActivo = false;
const memoryProfiles = {
  [defaultProfile.deviceId]: { ...defaultProfile },
};

function withFullImageUrl(req, item) {
  const obj = item.toObject ? item.toObject() : { ...item };
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (obj.imagen && obj.imagen.startsWith('/')) {
    if (obj.imagen.startsWith('/images/')) {
      obj.imagen = '';
      obj.imagenUrl = '';
    } else {
      obj.imagenUrl = `${baseUrl}${obj.imagen}`;
    }
  }
  return obj;
}

function isRateLimited(ip, targetKey) {
  const now = Date.now();
  const key = `${ip}:${targetKey}`;
  const last = recentReviewsByIp.get(key) || 0;
  if (now - last < REVIEW_COOLDOWN_MS) {
    return true;
  }
  recentReviewsByIp.set(key, now);
  if (recentReviewsByIp.size > 500) {
    for (const [k, ts] of recentReviewsByIp.entries()) {
      if (now - ts >= REVIEW_COOLDOWN_MS) recentReviewsByIp.delete(k);
    }
  }
  return false;
}

function formatReviewInput(body) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(body?.rating) || 5)));
  const autor = String(body?.autor || 'Viajero Explorador').trim().slice(0, 35);
  const comentario = String(body?.comentario || '').trim().slice(0, 180);
  return {
    rating,
    reviewEntry: comentario
      ? {
          autor: autor || 'Viajero Explorador',
          fecha: 'Reciente',
          rating,
          comentario,
        }
      : null,
  };
}

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    app: 'Celendín Explore API',
    db: mongoActivo ? 'mongodb' : 'embedded-json',
  })
);

app.get('/api/places', async (req, res) => {
  try {
    const list = mongoActivo ? await Place.find().sort({ orden: 1 }) : places;
    res.json(
      list.map((doc) => {
        const obj = withFullImageUrl(req, doc);
        const localMatch = places.find(
          (p) => (obj.id && p.id === obj.id) || p.nombre === obj.nombre
        );
        if (localMatch) {
          obj.mapEmbedUrl = obj.mapEmbedUrl || localMatch.mapEmbedUrl || '';
        }
        return obj;
      })
    );
  } catch (_e) {
    res.json(places.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.post('/api/places', async (req, res) => {
  if (isRateLimited(req.ip, 'create:place')) {
    return res.status(429).json({
      error: 'Espera unos segundos antes de registrar otro lugar.',
    });
  }

  const body = req.body || {};
  const nombre = String(body.nombre || '').trim().slice(0, 80);
  const ubicacion = String(body.ubicacion || '').trim().slice(0, 120);
  const categoria = String(body.categoria || 'Naturaleza').trim().slice(0, 30);
  const desc = String(body.desc || '').trim().slice(0, 450);

  if (!nombre || !ubicacion || !desc) {
    return res.status(400).json({
      error: 'Nombre, ubicación y descripción son obligatorios.',
    });
  }

  const distanciaCorta =
    String(body.distanciaCorta || body.distanciaGrid || 'Centro')
      .trim()
      .slice(0, 35) || 'Centro';
  const distancia =
    String(body.distancia || `A ${distanciaCorta} de Celendín`)
      .trim()
      .slice(0, 120);
  const direccionCorta =
    String(body.direccionCorta || ubicacion).trim().slice(0, 90);
  const altitudTexto =
    String(body.altitudTexto || '2,625 m.s.n.m.').trim().slice(0, 30) ||
    '2,625 m.s.n.m.';
  const precioTexto =
    String(body.precioTexto || 'Ingreso Libre').trim().slice(0, 35) ||
    'Ingreso Libre';
  const etiquetaDestacado = String(body.etiquetaDestacado || 'Nuevo Destino')
    .trim()
    .slice(0, 35);
  const horario =
    String(body.horario || '8:00 am – 5:00 pm').trim().slice(0, 80) ||
    '8:00 am – 5:00 pm';
  const tiempoEstimado =
    String(body.tiempoEstimado || horario).trim().slice(0, 80);
  const historia = String(body.historia || '').trim().slice(0, 450);
  const actividades = String(body.actividades || '').trim().slice(0, 300);
  const imagen = String(body.imagen || '').trim().slice(0, MAX_IMAGE_URL_LENGTH);
  const mapsQuery =
    String(
      body.mapsQuery || `${nombre}, ${ubicacion}, Celendín, Cajamarca, Perú`
    )
      .trim()
      .slice(0, 160);
  const mapEmbedUrl = String(body.mapEmbedUrl || '').trim().slice(0, 600);
  const latNum = Number(body.lat);
  const lngNum = Number(body.lng);

  const newPlaceData = {
    id: String(body.id || '').trim().slice(0, 60) || slugifyId('lugar', nombre),
    nombre,
    ubicacion,
    direccionCorta,
    distancia,
    distanciaCorta,
    distanciaGrid: distanciaCorta,
    altitudTexto,
    categoria,
    categoriaFiltro: String(body.categoriaFiltro || categoria).trim().slice(0, 30),
    precioTexto,
    rating: '0.0',
    ratingSum: 0,
    resenasCount: 0,
    etiquetaDestacado,
    mapsLabel: `Google Maps: ${nombre}`.slice(0, 70),
    horario,
    tiempoEstimado,
    tips: {
      llevar:
        String(body.tips?.llevar || 'Calzado cómodo, agua, bloqueador solar y cámara.')
          .trim()
          .slice(0, 200),
      mejorHorario:
        String(body.tips?.mejorHorario || horario).trim().slice(0, 120),
      dificultad:
        String(body.tips?.dificultad || 'Fácil – Moderada.').trim().slice(0, 120),
    },
    resenas: [],
    desc,
    historia,
    actividades,
    imagen,
    mapEmbedUrl,
    ...(Number.isFinite(latNum) && body.lat !== '' && body.lat !== null
      ? { lat: latNum }
      : {}),
    ...(Number.isFinite(lngNum) && body.lng !== '' && body.lng !== null
      ? { lng: lngNum }
      : {}),
    mapsQuery,
    defaultSaved: false,
    esExperienciaHoy: Boolean(body.esExperienciaHoy),
    orden: places.length + 1,
  };

  try {
    if (mongoActivo) {
      const count = await Place.countDocuments();
      if (count >= MAX_PLACES_FREE_TIER) {
        return res.status(409).json({
          error: `Límite máximo de ${MAX_PLACES_FREE_TIER} lugares alcanzado.`,
        });
      }
      newPlaceData.orden = count + 1;
      const created = await Place.create(newPlaceData);
      places.push(newPlaceData);
      return res.status(201).json(withFullImageUrl(req, created));
    }

    if (places.length >= MAX_PLACES_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_PLACES_FREE_TIER} lugares alcanzado.`,
      });
    }
    places.push(newPlaceData);
    return res.status(201).json(withFullImageUrl(req, newPlaceData));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.put('/api/places/:placeId', async (req, res) => {
  const { placeId } = req.params;
  const body = req.body || {};

  const updates = {};
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    updates.nombre = body.nombre.trim().slice(0, 80);
    updates.mapsLabel = `Google Maps: ${updates.nombre}`.slice(0, 70);
  }
  if (typeof body.ubicacion === 'string' && body.ubicacion.trim()) {
    updates.ubicacion = body.ubicacion.trim().slice(0, 120);
    updates.direccionCorta = String(body.direccionCorta || updates.ubicacion)
      .trim()
      .slice(0, 90);
  } else if (typeof body.direccionCorta === 'string') {
    updates.direccionCorta = body.direccionCorta.trim().slice(0, 90);
  }
  if (typeof body.categoria === 'string' && body.categoria.trim()) {
    updates.categoria = body.categoria.trim().slice(0, 30);
    updates.categoriaFiltro = updates.categoria;
  }
  if (typeof body.distanciaCorta === 'string') {
    updates.distanciaCorta = body.distanciaCorta.trim().slice(0, 35) || 'Centro';
    updates.distanciaGrid = updates.distanciaCorta;
    updates.distancia = `A ${updates.distanciaCorta} de Celendín`;
  }
  if (typeof body.altitudTexto === 'string') {
    updates.altitudTexto =
      body.altitudTexto.trim().slice(0, 30) || '2,625 m';
  }
  if (typeof body.precioTexto === 'string') {
    updates.precioTexto = body.precioTexto.trim().slice(0, 35) || 'Libre';
  }
  if (typeof body.horario === 'string') {
    updates.horario = body.horario.trim().slice(0, 80);
  }
  if (typeof body.tiempoEstimado === 'string') {
    updates.tiempoEstimado = body.tiempoEstimado.trim().slice(0, 80);
  }
  if (typeof body.actividades === 'string') {
    updates.actividades = body.actividades.trim().slice(0, 300);
  }
  if (typeof body.historia === 'string') {
    updates.historia = body.historia.trim().slice(0, 450);
  }
  if (typeof body.desc === 'string' && body.desc.trim()) {
    updates.desc = body.desc.trim().slice(0, 450);
  }
  if (typeof body.imagen === 'string') {
    updates.imagen = body.imagen.trim().slice(0, MAX_IMAGE_URL_LENGTH);
  }
  if (typeof body.mapEmbedUrl === 'string') {
    updates.mapEmbedUrl = body.mapEmbedUrl.trim().slice(0, 600);
  }
  if (typeof body.mapsQuery === 'string') {
    updates.mapsQuery = body.mapsQuery.trim().slice(0, 160);
  }
  if (body.lat !== undefined) {
    const latNum = Number(body.lat);
    if (body.lat !== '' && body.lat !== null && Number.isFinite(latNum)) {
      updates.lat = latNum;
    } else {
      updates.lat = undefined;
    }
  }
  if (body.lng !== undefined) {
    const lngNum = Number(body.lng);
    if (body.lng !== '' && body.lng !== null && Number.isFinite(lngNum)) {
      updates.lng = lngNum;
    } else {
      updates.lng = undefined;
    }
  }
  if (body.tips && typeof body.tips === 'object') {
    updates.tips = {
      llevar: String(body.tips.llevar || 'Calzado cómodo, agua y cámara.')
        .trim()
        .slice(0, 200),
      mejorHorario: String(body.tips.mejorHorario || updates.horario || '8:00 am – 5:00 pm')
        .trim()
        .slice(0, 120),
      dificultad: String(body.tips.dificultad || 'Fácil – Moderada')
        .trim()
        .slice(0, 120),
    };
  }

  try {
    const idx = places.findIndex((p) => p.id === placeId);
    if (idx !== -1) {
      places[idx] = { ...places[idx], ...updates };
    }

    if (mongoActivo) {
      const updated = await Place.findOneAndUpdate(
        { id: placeId },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json(withFullImageUrl(req, updated));
      }
    }

    if (idx === -1) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    return res.json(withFullImageUrl(req, places[idx]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.delete('/api/places/:placeId', async (req, res) => {
  const { placeId } = req.params;
  try {
    const idx = places.findIndex((p) => p.id === placeId);
    if (idx !== -1) {
      places.splice(idx, 1);
    }

    if (mongoActivo) {
      await Place.deleteOne({ id: placeId });
    }

    return res.json({ ok: true, id: placeId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/places/:placeId/reviews', async (req, res) => {
  const { placeId } = req.params;
  if (isRateLimited(req.ip, `place:${placeId}`)) {
    return res.status(429).json({
      error: 'Espera un momento antes de enviar otra reseña.',
    });
  }

  const { rating, reviewEntry } = formatReviewInput(req.body);

  try {
    if (mongoActivo) {
      const updateOps = {
        $inc: { resenasCount: 1, ratingSum: rating },
      };
      if (reviewEntry) {
        updateOps.$push = {
          resenas: {
            $each: [reviewEntry],
            $position: 0,
            $slice: MAX_REVIEWS_PER_ITEM,
          },
        };
      }

      const updated = await Place.findOneAndUpdate(
        { id: placeId, resenasCount: { $lt: MAX_REVIEWS_PER_ITEM } },
        updateOps,
        { new: true }
      );
      if (!updated) {
        const exists = await Place.exists({ id: placeId });
        if (!exists) {
          return res.status(404).json({ error: 'Lugar no encontrado' });
        }
        return res.status(409).json({
          error: `Límite máximo de ${MAX_REVIEWS_PER_ITEM} reseñas alcanzado para este destino.`,
          limitReached: true,
        });
      }

      const avg =
        updated.resenasCount > 0
          ? (updated.ratingSum / updated.resenasCount).toFixed(1)
          : '0.0';
      updated.rating = avg;
      await updated.save();

      return res.status(201).json(withFullImageUrl(req, updated));
    }

    const target = places.find((p) => p.id === placeId);
    if (!target) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    if ((Number(target.resenasCount) || 0) >= MAX_REVIEWS_PER_ITEM) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_REVIEWS_PER_ITEM} reseñas alcanzado para este destino.`,
        limitReached: true,
      });
    }
    target.resenasCount = (Number(target.resenasCount) || 0) + 1;
    target.ratingSum = (Number(target.ratingSum) || 0) + rating;
    target.rating = (target.ratingSum / target.resenasCount).toFixed(1);
    if (reviewEntry) {
      target.resenas = [reviewEntry, ...(target.resenas || [])].slice(
        0,
        MAX_REVIEWS_PER_ITEM
      );
    }
    return res.status(201).json(withFullImageUrl(req, target));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/directory', async (req, res) => {
  try {
    const list = mongoActivo
      ? await DirectoryItem.find().sort({ orden: 1 })
      : directory;
    res.json(list.map((doc) => withFullImageUrl(req, doc)));
  } catch (_e) {
    res.json(directory.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.post('/api/directory', async (req, res) => {
  if (isRateLimited(req.ip, 'create:directory')) {
    return res.status(429).json({
      error: 'Espera unos segundos antes de registrar otro establecimiento.',
    });
  }

  const body = req.body || {};
  const nombre = String(body.nombre || '').trim().slice(0, 80);
  const categoria = String(body.categoria || 'Gastronomía').trim().slice(0, 35);
  const especialidad = String(body.especialidad || '').trim().slice(0, 140);
  const direccion = String(body.direccion || '').trim().slice(0, 120);

  if (!nombre || !especialidad || !direccion) {
    return res.status(400).json({
      error: 'Nombre, especialidad y dirección son obligatorios.',
    });
  }

  const badge =
    String(body.badge || 'Recomendado').trim().slice(0, 35) || 'Recomendado';
  const rangoPrecio =
    String(body.rangoPrecio || 'S/ 15 - S/ 45').trim().slice(0, 35) ||
    'S/ 15 - S/ 45';
  const rawPhone = String(body.telefono || body.whatsapp || '+51976000000')
    .trim()
    .slice(0, 25);
  const digitsOnly = String(body.whatsapp || rawPhone).replace(/\D/g, '');
  const whatsapp =
    digitsOnly.length === 9 && digitsOnly.startsWith('9')
      ? `51${digitsOnly}`
      : digitsOnly || '51976000000';
  const telefono = rawPhone.startsWith('+')
    ? rawPhone
    : `+${whatsapp}`;
  const imagen = String(body.imagen || '').trim().slice(0, MAX_IMAGE_URL_LENGTH);

  const newDirItem = {
    id: String(body.id || '').trim().slice(0, 60) || slugifyId('dir', nombre),
    categoria,
    badge,
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
    orden: directory.length + 1,
  };

  try {
    if (mongoActivo) {
      const count = await DirectoryItem.countDocuments();
      if (count >= MAX_DIRECTORY_FREE_TIER) {
        return res.status(409).json({
          error: `Límite máximo de ${MAX_DIRECTORY_FREE_TIER} establecimientos alcanzado.`,
        });
      }
      newDirItem.orden = count + 1;
      const created = await DirectoryItem.create(newDirItem);
      directory.push(newDirItem);
      return res.status(201).json(withFullImageUrl(req, created));
    }

    if (directory.length >= MAX_DIRECTORY_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_DIRECTORY_FREE_TIER} establecimientos alcanzado.`,
      });
    }
    directory.push(newDirItem);
    return res.status(201).json(withFullImageUrl(req, newDirItem));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.put('/api/directory/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const body = req.body || {};

  const updates = {};
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    updates.nombre = body.nombre.trim().slice(0, 80);
  }
  if (typeof body.categoria === 'string' && body.categoria.trim()) {
    updates.categoria = body.categoria.trim().slice(0, 35);
    updates.badge = String(body.badge || updates.categoria).trim().slice(0, 35);
  }
  if (typeof body.especialidad === 'string' && body.especialidad.trim()) {
    updates.especialidad = body.especialidad.trim().slice(0, 140);
  }
  if (typeof body.direccion === 'string' && body.direccion.trim()) {
    updates.direccion = body.direccion.trim().slice(0, 120);
  }
  if (typeof body.rangoPrecio === 'string') {
    updates.rangoPrecio =
      body.rangoPrecio.trim().slice(0, 35) || 'S/ 15 - S/ 45';
  }
  if (typeof body.telefono === 'string' && body.telefono.trim()) {
    const rawPhone = body.telefono.trim().slice(0, 25);
    const digitsOnly = String(body.whatsapp || rawPhone).replace(/\D/g, '');
    updates.whatsapp =
      digitsOnly.length === 9 && digitsOnly.startsWith('9')
        ? `51${digitsOnly}`
        : digitsOnly || '51976579996';
    updates.telefono = rawPhone.startsWith('+')
      ? rawPhone
      : `+${updates.whatsapp}`;
  }
  if (typeof body.imagen === 'string') {
    updates.imagen = body.imagen.trim().slice(0, MAX_IMAGE_URL_LENGTH);
  }

  try {
    const idx = directory.findIndex((d) => d.id === itemId);
    if (idx !== -1) {
      directory[idx] = { ...directory[idx], ...updates };
    }

    if (mongoActivo) {
      const updated = await DirectoryItem.findOneAndUpdate(
        { id: itemId },
        { $set: updates },
        { new: true }
      );
      if (updated) {
        return res.json(withFullImageUrl(req, updated));
      }
    }

    if (idx === -1) {
      return res.status(404).json({ error: 'Establecimiento no encontrado' });
    }
    return res.json(withFullImageUrl(req, directory[idx]));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.delete('/api/directory/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    const idx = directory.findIndex((d) => d.id === itemId);
    if (idx !== -1) {
      directory.splice(idx, 1);
    }

    if (mongoActivo) {
      await DirectoryItem.deleteOne({ id: itemId });
    }

    return res.json({ ok: true, id: itemId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/directory/:itemId/reviews', async (req, res) => {
  const { itemId } = req.params;
  if (isRateLimited(req.ip, `dir:${itemId}`)) {
    return res.status(429).json({
      error: 'Espera un momento antes de enviar otra calificación.',
    });
  }

  const rating = Math.min(5, Math.max(1, Math.round(Number(req.body?.rating) || 5)));

  try {
    if (mongoActivo) {
      const updated = await DirectoryItem.findOneAndUpdate(
        { id: itemId, resenasCount: { $lt: MAX_REVIEWS_PER_ITEM } },
        { $inc: { resenasCount: 1, ratingSum: rating } },
        { new: true }
      );
      if (!updated) {
        const exists = await DirectoryItem.exists({ id: itemId });
        if (!exists) {
          return res.status(404).json({ error: 'Establecimiento no encontrado' });
        }
        return res.status(409).json({
          error: `Límite máximo de ${MAX_REVIEWS_PER_ITEM} calificaciones alcanzado.`,
          limitReached: true,
        });
      }
      updated.rating =
        updated.resenasCount > 0
          ? (updated.ratingSum / updated.resenasCount).toFixed(1)
          : '0.0';
      await updated.save();
      return res.status(201).json(withFullImageUrl(req, updated));
    }

    const target = directory.find((d) => d.id === itemId);
    if (!target) {
      return res.status(404).json({ error: 'Establecimiento no encontrado' });
    }
    if ((Number(target.resenasCount) || 0) >= MAX_REVIEWS_PER_ITEM) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_REVIEWS_PER_ITEM} calificaciones alcanzado.`,
        limitReached: true,
      });
    }
    target.resenasCount = (Number(target.resenasCount) || 0) + 1;
    target.ratingSum = (Number(target.ratingSum) || 0) + rating;
    target.rating = (target.ratingSum / target.resenasCount).toFixed(1);
    return res.status(201).json(withFullImageUrl(req, target));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ================= COLECCIONES ADMINISTRABLES: INICIO, EMERGENCIAS, TRANSPORTE =================
const memoryCollections = {
  banners: seedHomeBanners.map((b) => ({ ...b })),
  emergencies: seedEmergencyNumbers.map((e) => ({ ...e })),
  transport: seedTransportAgencies.map((t) => ({ ...t })),
};

const cleanText = (value, max) => String(value || '').trim().slice(0, max);

const HOME_DESTINATIONS = ['Directorio', 'Lugares', 'Perfil / Offline'];

function sanitizeBanner(body) {
  return {
    etiqueta: (cleanText(body.etiqueta, 40) || 'DESTACADO').toUpperCase(),
    titulo: cleanText(body.titulo, 80),
    subtitulo: cleanText(body.subtitulo, 200),
    destino: HOME_DESTINATIONS.includes(body.destino) ? body.destino : 'Directorio',
  };
}

function sanitizeEmergency(body) {
  const numero = cleanText(body.numero, 25);
  return {
    titulo: cleanText(body.titulo, 80),
    numero,
    tel: numero.replace(/\D/g, '') || numero,
    detalle: cleanText(body.detalle, 140) || 'Atención de emergencias en Celendín',
  };
}

function sanitizeTransport(body) {
  return {
    tipo: ['combis', 'autos'].includes(body.tipo) ? body.tipo : 'buses',
    empresa: cleanText(body.empresa, 80),
    ruta: cleanText(body.ruta, 140),
    terminal: cleanText(body.terminal, 140),
  };
}

function registerSimpleCrud({ route, Model, memKey, prefix, sanitize, required, max = 40 }) {
  const toPlain = (doc) => (doc && doc.toObject ? doc.toObject() : doc);
  const missingFields = (data) => required.filter((k) => !data[k]);

  app.get(`/api/${route}`, async (_req, res) => {
    try {
      if (mongoActivo) {
        const list = await Model.find().sort({ orden: 1, createdAt: 1 }).lean();
        return res.json(list);
      }
      return res.json(memoryCollections[memKey]);
    } catch (_e) {
      return res.json(memoryCollections[memKey]);
    }
  });

  app.post(`/api/${route}`, async (req, res) => {
    const data = sanitize(req.body || {});
    const missing = missingFields(data);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obligatorios: ${missing.join(', ')}` });
    }
    data.id = cleanText(req.body?.id, 60) || slugifyId(prefix, data[required[0]]);

    try {
      if (mongoActivo) {
        const count = await Model.countDocuments();
        if (count >= max) {
          return res.status(409).json({ error: `Límite máximo de ${max} registros alcanzado.` });
        }
        data.orden = count + 1;
        const created = await Model.create(data);
        return res.status(201).json(toPlain(created));
      }
      const list = memoryCollections[memKey];
      if (list.length >= max) {
        return res.status(409).json({ error: `Límite máximo de ${max} registros alcanzado.` });
      }
      data.orden = list.length + 1;
      list.push(data);
      return res.status(201).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.put(`/api/${route}/:itemId`, async (req, res) => {
    const { itemId } = req.params;
    const data = sanitize(req.body || {});
    const missing = missingFields(data);
    if (missing.length) {
      return res.status(400).json({ error: `Campos obligatorios: ${missing.join(', ')}` });
    }

    try {
      if (mongoActivo) {
        const updated = await Model.findOneAndUpdate(
          { id: itemId },
          { $set: data },
          { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Registro no encontrado' });
        return res.json(toPlain(updated));
      }
      const list = memoryCollections[memKey];
      const idx = list.findIndex((i) => i.id === itemId);
      if (idx === -1) return res.status(404).json({ error: 'Registro no encontrado' });
      list[idx] = { ...list[idx], ...data };
      return res.json(list[idx]);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete(`/api/${route}/:itemId`, async (req, res) => {
    const { itemId } = req.params;
    try {
      if (mongoActivo) {
        await Model.deleteOne({ id: itemId });
      } else {
        memoryCollections[memKey] = memoryCollections[memKey].filter((i) => i.id !== itemId);
      }
      return res.json({ ok: true, id: itemId });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}

registerSimpleCrud({
  route: 'banners',
  Model: HomeBanner,
  memKey: 'banners',
  prefix: 'home',
  sanitize: sanitizeBanner,
  required: ['titulo'],
});

registerSimpleCrud({
  route: 'emergencies',
  Model: EmergencyNumber,
  memKey: 'emergencies',
  prefix: 'sos',
  sanitize: sanitizeEmergency,
  required: ['titulo', 'numero'],
});

registerSimpleCrud({
  route: 'transport',
  Model: TransportAgency,
  memKey: 'transport',
  prefix: 'bus',
  sanitize: sanitizeTransport,
  required: ['empresa', 'ruta', 'terminal'],
});

app.get('/api/culture', async (req, res) => {
  try {
    const list = mongoActivo
      ? await Culture.find().sort({ orden: 1 })
      : culture;
    res.json(list.map((doc) => withFullImageUrl(req, doc)));
  } catch (_e) {
    res.json(culture.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const list = mongoActivo
      ? await GalleryImage.find().sort({ orden: 1 })
      : gallery;
    res.json(list.map((doc) => withFullImageUrl(req, doc)));
  } catch (_e) {
    res.json(gallery.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.get('/api/profile/:deviceId', async (req, res) => {
  const deviceId = String(req.params.deviceId || defaultProfile.deviceId)
    .trim()
    .slice(0, 64);

  try {
    if (mongoActivo) {
      const existing = await UserProfile.findOne({ deviceId });
      if (existing) return res.json(existing);

      const totalProfiles = await UserProfile.countDocuments();
      if (totalProfiles >= MAX_PROFILES_FREE_TIER) {
        return res.json({ ...defaultProfile, deviceId });
      }
      const created = await UserProfile.create({ ...defaultProfile, deviceId });
      return res.json(created);
    }

    if (!memoryProfiles[deviceId]) {
      memoryProfiles[deviceId] = { ...defaultProfile, deviceId };
    }
    return res.json(memoryProfiles[deviceId]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.put('/api/profile/:deviceId', async (req, res) => {
  const deviceId = String(req.params.deviceId || defaultProfile.deviceId)
    .trim()
    .slice(0, 64);

  const updates = {};
  if (Array.isArray(req.body?.savedPlaceIds)) {
    updates.savedPlaceIds = [...new Set(req.body.savedPlaceIds.map(String))].slice(
      0,
      20
    );
  }
  if (typeof req.body?.darkMode === 'boolean') {
    updates.darkMode = req.body.darkMode;
  }
  if (req.body?.language === 'es' || req.body?.language === 'en') {
    updates.language = req.body.language;
  }
  if (typeof req.body?.offlineReady === 'boolean') {
    updates.offlineReady = req.body.offlineReady;
  }

  try {
    if (mongoActivo) {
      const existing = await UserProfile.findOne({ deviceId });
      if (!existing) {
        const totalProfiles = await UserProfile.countDocuments();
        if (totalProfiles >= MAX_PROFILES_FREE_TIER) {
          return res.json({ ...defaultProfile, deviceId, ...updates });
        }
      }
      const profile = await UserProfile.findOneAndUpdate(
        { deviceId },
        {
          $set: updates,
          $setOnInsert: { deviceId },
        },
        { new: true, upsert: true }
      );
      return res.json(profile);
    }

    memoryProfiles[deviceId] = {
      ...(memoryProfiles[deviceId] || { ...defaultProfile, deviceId }),
      ...updates,
    };
    return res.json(memoryProfiles[deviceId]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;

// Sincronización única: reemplaza datos antiguos/ficticios de la BD por los datos
// reales de Celendín y limpia imágenes predeterminadas (/images/...).
const SEED_VERSION = 3;

async function syncRealSeedData() {
  try {
    // Limpia cualquier imagen predefinida (/images/...) en la BD para que solo queden las subidas por el usuario
    await Place.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );
    await DirectoryItem.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );
    await Culture.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );
    await GalleryImage.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );

    const meta = await AppMeta.findOne({ key: 'seed' });
    if (meta && meta.version >= SEED_VERSION) return;

    const RATING_KEYS = ['rating', 'ratingSum', 'resenasCount', 'resenas'];
    const splitRating = (item) => {
      const content = { ...item };
      RATING_KEYS.forEach((k) => delete content[k]);
      return content;
    };

    for (const p of places) {
      await Place.updateOne(
        { id: p.id },
        {
          $set: splitRating(p),
          $setOnInsert: { rating: '0.0', ratingSum: 0, resenasCount: 0, resenas: [] },
        },
        { upsert: true }
      );
    }

    await DirectoryItem.deleteMany({ id: { $in: legacyDirectoryIds } });
    for (const d of directory) {
      await DirectoryItem.updateOne(
        { id: d.id },
        {
          $set: splitRating(d),
          $setOnInsert: { rating: '0.0', ratingSum: 0, resenasCount: 0 },
        },
        { upsert: true }
      );
    }

    if ((await HomeBanner.countDocuments()) === 0) {
      await HomeBanner.insertMany(seedHomeBanners);
    }
    if ((await EmergencyNumber.countDocuments()) === 0) {
      await EmergencyNumber.insertMany(seedEmergencyNumbers);
    }
    if ((await TransportAgency.countDocuments()) === 0) {
      await TransportAgency.insertMany(seedTransportAgencies);
    }

    await AppMeta.updateOne(
      { key: 'seed' },
      { $set: { version: SEED_VERSION } },
      { upsert: true }
    );
    console.log(`Datos reales sincronizados en MongoDB (versión ${SEED_VERSION})`);
  } catch (e) {
    console.warn('No se pudo sincronizar los datos semilla:', e.message);
  }
}

function iniciarServidor() {
  const srv = app.listen(PORT, '0.0.0.0', () =>
    console.log(
      `API e Imágenes en http://0.0.0.0:${PORT} (DB: ${
        mongoActivo ? 'MongoDB' : 'JSON integrado'
      })`
    )
  );
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`API ya está activa en el puerto ${PORT}`);
    } else {
      console.error('Error en servidor:', err.message);
    }
  });
}

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 })
  .then(async () => {
    mongoActivo = true;
    console.log('MongoDB conectado (Celendín Explore)');
    const placeCount = await Place.countDocuments();
    if (placeCount === 0) {
      await Place.insertMany(places);
      await Culture.insertMany(culture);
      await GalleryImage.insertMany(gallery);
    }
    const dirCount = await DirectoryItem.countDocuments();
    if (dirCount === 0) {
      await DirectoryItem.insertMany(directory);
    }
    await syncRealSeedData();
    iniciarServidor();
  })
  .catch((e) => {
    console.warn(
      'MongoDB no disponible, usando base de datos JSON integrada sin costo:',
      e.message
    );
    iniciarServidor();
  });
