const express = require('express');
const { DirectoryItem } = require('../models');
const { isRateLimited } = require('../middleware/rateLimit');
const { toPlainObject } = require('../utils/helpers');
const {
  MAX_DIRECTORY_FREE_TIER,
  MAX_REVIEWS_PER_ITEM,
  sanitizeDirectoryCreate,
  sanitizeDirectoryUpdate,
} = require('../utils/sanitizers');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const list = await DirectoryItem.find().sort({ orden: 1, createdAt: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  if (isRateLimited(req.ip, 'create:directory')) {
    return res.status(429).json({
      error: 'Espera unos segundos antes de registrar otro establecimiento.',
    });
  }

  try {
    const count = await DirectoryItem.countDocuments();
    if (count >= MAX_DIRECTORY_FREE_TIER) {
      return res.status(409).json({
        error: `Límite máximo de ${MAX_DIRECTORY_FREE_TIER} establecimientos alcanzado.`,
      });
    }

    const { error, data } = sanitizeDirectoryCreate(req.body, count);
    if (error) {
      return res.status(400).json({ error });
    }

    const created = await DirectoryItem.create(data);
    return res.status(201).json(toPlainObject(created));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.put('/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const updates = sanitizeDirectoryUpdate(req.body);

  try {
    const updated = await DirectoryItem.findOneAndUpdate(
      { id: itemId },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({
        error: 'Establecimiento no encontrado en MongoDB Atlas',
      });
    }
    return res.json(toPlainObject(updated));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.delete('/:itemId', async (req, res) => {
  const { itemId } = req.params;
  try {
    await DirectoryItem.deleteOne({ id: itemId });
    return res.json({ ok: true, id: itemId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/:itemId/reviews', async (req, res) => {
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

module.exports = router;
