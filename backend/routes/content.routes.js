const express = require('express');
const { Culture, GalleryImage } = require('../models');
const { toPlainObject } = require('../utils/helpers');

const router = express.Router();

router.get('/health', (_req, res) =>
  res.json({
    ok: true,
    app: 'Celendín Explore API',
    db: 'mongodb-atlas',
  })
);

router.get('/culture', async (_req, res) => {
  try {
    const list = await Culture.find().sort({ orden: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get('/images', async (_req, res) => {
  try {
    const list = await GalleryImage.find().sort({ orden: 1 });
    return res.json(list.map(toPlainObject));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
