const mongoose = require('mongoose');

const TransportAgencySchema = new mongoose.Schema(
  {
    id: { type: String, index: true, required: true },
    tipo: {
      type: String,
      enum: ['buses', 'combis', 'autos'],
      default: 'buses',
    },
    empresa: { type: String, required: true, maxlength: 80 },
    ruta: { type: String, required: true, maxlength: 140 },
    terminal: { type: String, required: true, maxlength: 140 },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportAgency', TransportAgencySchema);
