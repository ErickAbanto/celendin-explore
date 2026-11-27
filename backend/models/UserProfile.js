const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, maxlength: 64 },
    savedPlaceIds: { type: [String], default: [] },
    darkMode: { type: Boolean, default: false },
    language: { type: String, enum: ['es', 'en'], default: 'es' },
    offlineReady: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-limpieza en MongoDB Free Tier tras 60 días sin actividad para evitar llenado
userProfileSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 5184000 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
