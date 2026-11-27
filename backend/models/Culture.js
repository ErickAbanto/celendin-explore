const mongoose = require('mongoose');

const CultureSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    categoria: { type: String, required: true },
    etiqueta: { type: String, required: true },
    desc: { type: String, required: true },
    imagen: { type: String, default: '' },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Culture', CultureSchema);
