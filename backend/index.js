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
} = require('./models');
const {
  places,
  directory,
  culture,
  gallery,
  defaultProfile,
} = require('./data');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '16kb' }));

// Carpeta pública de imágenes servidas desde el backend: http://<host>:3000/images/<archivo>.jpg
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Límites anti-spam y protección para MongoDB Atlas Free Tier (512 MB)
const MAX_REVIEWS_PER_ITEM = 20;
const MAX_PROFILES_FREE_TIER = 1000;
const REVIEW_COOLDOWN_MS = 3000;
const recentReviewsByIp = new Map();

let mongoActivo = false;
const memoryProfiles = {
  [defaultProfile.deviceId]: { ...defaultProfile },
};

function withFullImageUrl(req, item) {
  const obj = item.toObject ? item.toObject() : { ...item };
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (obj.imagen && obj.imagen.startsWith('/')) {
    obj.imagenUrl = `${baseUrl}${obj.imagen}`;
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
    iniciarServidor();
  })
  .catch((e) => {
    console.warn(
      'MongoDB no disponible, usando base de datos JSON integrada sin costo:',
      e.message
    );
    iniciarServidor();
  });
