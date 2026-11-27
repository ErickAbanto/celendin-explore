require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
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
} = require('./models');

// Longitud máxima para imágenes subidas en base64 (data:image/...) o links guardados en MongoDB Atlas
const MAX_IMAGE_URL_LENGTH = 800000;

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

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

function toPlainObject(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (typeof obj.imagen === 'string' && obj.imagen.startsWith('/images/')) {
    obj.imagen = '';
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
    db: 'mongodb-atlas',
  })
);

// ================= LUGARES TURÍSTICOS (100% MONGODB ATLAS) =================
app.get('/api/places', async (_req, res) => {
  try {
    const list = await Place.find().sort({ orden: 1, createdAt: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
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

  try {
    const count = await Place.countDocuments();
    if (count >= MAX_PLACES_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_PLACES_FREE_TIER} lugares alcanzado.`,
      });
    }

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
      mapsQuery,
      defaultSaved: false,
      esExperienciaHoy: Boolean(body.esExperienciaHoy),
      orden: count + 1,
    };

    const created = await Place.create(newPlaceData);
    return res.status(201).json(toPlainObject(created));
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
    const updated = await Place.findOneAndUpdate(
      { id: placeId },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Lugar no encontrado en MongoDB Atlas' });
    }
    return res.json(toPlainObject(updated));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.delete('/api/places/:placeId', async (req, res) => {
  const { placeId } = req.params;
  try {
    await Place.deleteOne({ id: placeId });
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

    return res.status(201).json(toPlainObject(updated));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ================= DIRECTORIO (100% MONGODB ATLAS) =================
app.get('/api/directory', async (_req, res) => {
  try {
    const list = await DirectoryItem.find().sort({ orden: 1, createdAt: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
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
    String(body.badge || categoria || 'Recomendado').trim().slice(0, 35) || 'Recomendado';
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

  try {
    const count = await DirectoryItem.countDocuments();
    if (count >= MAX_DIRECTORY_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_DIRECTORY_FREE_TIER} establecimientos alcanzado.`,
      });
    }

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
      orden: count + 1,
    };

    const created = await DirectoryItem.create(newDirItem);
    return res.status(201).json(toPlainObject(created));
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
    const updated = await DirectoryItem.findOneAndUpdate(
      { id: itemId },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Establecimiento no encontrado en MongoDB Atlas' });
    }
    return res.json(toPlainObject(updated));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.delete('/api/directory/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    await DirectoryItem.deleteOne({ id: itemId });
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
    return res.status(201).json(toPlainObject(updated));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ================= PERFIL (EMERGENCIAS Y TRANSPORTE 100% MONGODB ATLAS) =================
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

function registerAtlasCrud({ route, Model, prefix, sanitize, required, max = 40 }) {
  const missingFields = (data) => required.filter((k) => !data[k]);

  app.get(`/api/${route}`, async (_req, res) => {
    try {
      const list = await Model.find().sort({ orden: 1, createdAt: 1 }).lean();
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: e.message });
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
      const count = await Model.countDocuments();
      if (count >= max) {
        return res.status(409).json({ error: `Límite máximo de ${max} registros alcanzado.` });
      }
      data.orden = count + 1;
      const created = await Model.create(data);
      return res.status(201).json(toPlainObject(created));
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
      const updated = await Model.findOneAndUpdate(
        { id: itemId },
        { $set: data },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Registro no encontrado en MongoDB Atlas' });
      return res.json(toPlainObject(updated));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete(`/api/${route}/:itemId`, async (req, res) => {
    const { itemId } = req.params;
    try {
      await Model.deleteOne({ id: itemId });
      return res.json({ ok: true, id: itemId });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}

registerAtlasCrud({
  route: 'banners',
  Model: HomeBanner,
  prefix: 'home',
  sanitize: sanitizeBanner,
  required: ['titulo'],
});

registerAtlasCrud({
  route: 'emergencies',
  Model: EmergencyNumber,
  prefix: 'sos',
  sanitize: sanitizeEmergency,
  required: ['titulo', 'numero'],
});

registerAtlasCrud({
  route: 'transport',
  Model: TransportAgency,
  prefix: 'bus',
  sanitize: sanitizeTransport,
  required: ['empresa', 'ruta', 'terminal'],
});

app.get('/api/culture', async (_req, res) => {
  try {
    const list = await Culture.find().sort({ orden: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/images', async (_req, res) => {
  try {
    const list = await GalleryImage.find().sort({ orden: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/profile/:deviceId', async (req, res) => {
  const deviceId = String(req.params.deviceId || 'explorador-shilico')
    .trim()
    .slice(0, 64);

  try {
    const existing = await UserProfile.findOne({ deviceId });
    if (existing) return res.json(existing);

    const defaultProf = {
      deviceId,
      savedPlaceIds: [],
      darkMode: false,
      language: 'es',
      offlineReady: false,
    };
    const totalProfiles = await UserProfile.countDocuments();
    if (totalProfiles >= MAX_PROFILES_FREE_TIER) {
      return res.json(defaultProf);
    }
    const created = await UserProfile.create(defaultProf);
    return res.json(created);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.put('/api/profile/:deviceId', async (req, res) => {
  const deviceId = String(req.params.deviceId || 'explorador-shilico')
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
    const profile = await UserProfile.findOneAndUpdate(
      { deviceId },
      {
        $set: updates,
        $setOnInsert: { deviceId },
      },
      { new: true, upsert: true }
    );
    return res.json(profile);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;

function iniciarServidor() {
  const srv = app.listen(PORT, '0.0.0.0', () =>
    console.log(`API conectada 100% a MongoDB Atlas en http://0.0.0.0:${PORT}`)
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
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
  .then(async () => {
    console.log('MongoDB Atlas conectado en la nube (Celendín Explore)');
    // Limpia cualquier referencia antigua a /images/ en la nube
    await Place.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );
    await DirectoryItem.updateMany(
      { imagen: { $regex: '^/images/' } },
      { $set: { imagen: '' } }
    );
    iniciarServidor();
  })
  .catch((e) => {
    console.error('Error conectando a MongoDB Atlas:', e.message);
    iniciarServidor();
  });
