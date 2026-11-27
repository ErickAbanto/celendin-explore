const mongoose = require('mongoose');

const EmergencyNumberSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, required: true },
    titulo: { type: String, required: true, maxlength: 80 },
    numero: { type: String, required: true, maxlength: 25 },
    tel: { type: String, default: '', maxlength: 25 },
    detalle: { type: String, default: '', maxlength: 140 },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyNumber', EmergencyNumberSchema);
