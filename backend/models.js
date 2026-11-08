const mongoose = require('mongoose');

const Place = mongoose.model(
  'Place',
  new mongoose.Schema(
    {
      nombre: { type: String, required: true },
      ubicacion: { type: String, required: true },
      categoria: { type: String, required: true },
      horario: { type: String, default: 'Acceso libre' },
      desc: { type: String, required: true },
      imagen: { type: String, required: true },
      orden: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

const Culture = mongoose.model(
  'Culture',
  new mongoose.Schema(
    {
      nombre: { type: String, required: true },
      categoria: { type: String, required: true },
      etiqueta: { type: String, required: true },
      desc: { type: String, required: true },
      imagen: { type: String, required: true },
      orden: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

const GalleryImage = mongoose.model(
  'GalleryImage',
  new mongoose.Schema(
    {
      clave: { type: String, required: true },
      titulo: { type: String, required: true },
      subtitulo: { type: String, default: '' },
      imagen: { type: String, required: true },
      orden: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

module.exports = { Place, Culture, GalleryImage };
