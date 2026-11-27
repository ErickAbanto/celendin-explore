const mongoose = require('mongoose');

const DirectoryItemSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    categoria: { type: String, required: true },
    badge: { type: String, default: '' },
    rangoPrecio: { type: String, default: '' },
    nombre: { type: String, required: true },
    verificado: { type: Boolean, default: true },
    rating: { type: String, default: '0.0' },
    ratingSum: { type: Number, default: 0 },
    resenasCount: { type: Number, default: 0 },
    especialidad: { type: String, default: '' },
    direccion: { type: String, default: '' },
    telefono: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    imagen: { type: String, default: '' },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DirectoryItem', DirectoryItemSchema);
