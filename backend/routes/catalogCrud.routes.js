const express = require('express');
const { cleanText, slugifyId, toPlainObject } = require('../utils/helpers');

function createCatalogCrudRouter({ Model, prefix, sanitize, required, max = 40 }) {
  const router = express.Router();
  const missingFields = (data) => required.filter((k) => !data[k]);

  router.get('/', async (_req, res) => {
    try {
      const list = await Model.find().sort({ orden: 1, createdAt: 1 }).lean();
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.post('/', async (req, res) => {
    const data = sanitize(req.body || {});
    const missing = missingFields(data);
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Campos obligatorios: ${missing.join(', ')}` });
    }
    data.id = cleanText(req.body?.id, 60) || slugifyId(prefix, data[required[0]]);

    try {
      const count = await Model.countDocuments();
      if (count >= max) {
        return res
          .status(409)
          .json({ error: `Límite máximo de ${max} registros alcanzado.` });
      }
      data.orden = count + 1;
      const created = await Model.create(data);
      return res.status(201).json(toPlainObject(created));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.put('/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const data = sanitize(req.body || {});
    const missing = missingFields(data);
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Campos obligatorios: ${missing.join(', ')}` });
    }

    try {
      const updated = await Model.findOneAndUpdate(
        { id: itemId },
        { $set: data },
        { new: true }
      );
      if (!updated) {
        return res
          .status(404)
          .json({ error: 'Registro no encontrado en MongoDB Atlas' });
      }
      return res.json(toPlainObject(updated));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.delete('/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
      await Model.deleteOne({ id: itemId });
      return res.json({ ok: true, id: itemId });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = { createCatalogCrudRouter };
