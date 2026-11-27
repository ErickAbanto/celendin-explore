const express = require('express');
const { UserProfile } = require('../models');
const { cleanText } = require('../utils/helpers');
const { MAX_PROFILES_FREE_TIER } = require('../utils/sanitizers');

const router = express.Router();

router.get('/:deviceId', async (req, res) => {
  const deviceId = cleanText(req.params.deviceId || 'explorador-shilico', 64);

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

router.put('/:deviceId', async (req, res) => {
  const deviceId = cleanText(req.params.deviceId || 'explorador-shilico', 64);

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

module.exports = router;
