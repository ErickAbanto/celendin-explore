const express = require('express');
const { Place } = require('../models');
const { isRateLimited } = require('../middleware/rateLimit');
const { toPlainObject } = require('../utils/helpers');
const {
  MAX_PLACES_FREE_TIER,
  MAX_REVIEWS_PER_ITEM,
  formatReviewInput,
  sanitizePlaceCreate,
  sanitizePlaceUpdate,
} = require('../utils/sanitizers');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const list = await Place.find().sort({ orden: 1, createdAt: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  if (isRateLimited(req.ip, 'create:place')) {
    return res.status(429).json({
      error: 'Espera unos segundos antes de registrar otro lugar.',
    });
  }

  try {
    const count = await Place.countDocuments();
    if (count >= MAX_PLACES_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_PLACES_FREE_TIER} lugares alcanzado.`,
      });
    }

    const { error, data } = sanitizePlaceCreate(req.body, count);
    if (error) {
      return res.status(400).json({ error });
    }

    const created = await Place.create(data);
    return res.status(201).json(toPlainObject(created));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.put('/:placeId', async (req, res) => {
  const { placeId } = req.params;
  const updates = sanitizePlaceUpdate(req.body);

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

router.delete('/:placeId', async (req, res) => {
  const { placeId } = req.params;
  try {
    await Place.deleteOne({ id: placeId });
    return res.json({ ok: true, id: placeId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/:placeId/reviews', async (req, res) => {
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

module.exports = router;
