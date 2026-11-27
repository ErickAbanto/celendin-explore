const mongoose = require('mongoose');

const GalleryImageSchema = new mongoose.Schema(
  {
    clave: { type: String, required: true },
    titulo: { type: String, required: true },
    subtitulo: { type: String, default: '' },
    imagen: { type: String, default: '' },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GalleryImage', GalleryImageSchema);
