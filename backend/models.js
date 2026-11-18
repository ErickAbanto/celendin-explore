const mongoose = require('mongoose');

const TipSchema = new mongoose.Schema(
  {
    llevar: { type: String, default: '' },
    mejorHorario: { type: String, default: '' },
    dificultad: { type: String, default: '' },
  },
  { _id: false }
);

const ReviewSchema = new mongoose.Schema(
  {
    autor: { type: String, required: true, maxlength: 35 },
    fecha: { type: String, default: 'Reciente', maxlength: 24 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    comentario: { type: String, default: '', maxlength: 180 },
  },
  { _id: false }
);

const Place = mongoose.model(
  'Place',
  new mongoose.Schema(
    {
      id: { type: String, index: true },
      nombre: { type: String, required: true },
      ubicacion: { type: String, required: true },
      direccionCorta: { type: String, default: '' },
      distancia: { type: String, default: '' },
      distanciaCorta: { type: String, default: '' },
      distanciaGrid: { type: String, default: '' },
      altitudTexto: { type: String, default: '2,625 m.s.n.m.' },
      categoria: { type: String, required: true },
      categoriaFiltro: { type: String, default: '' },
      precioTexto: { type: String, default: 'Ingreso Libre' },
      rating: { type: String, default: '0.0' },
      ratingSum: { type: Number, default: 0 },
      resenasCount: { type: Number, default: 0 },
      etiquetaDestacado: { type: String, default: '' },
      mapsLabel: { type: String, default: '' },
      horario: { type: String, default: 'Acceso libre' },
      tiempoEstimado: { type: String, default: '' },
      tips: { type: TipSchema, default: () => ({}) },
      resenas: { type: [ReviewSchema], default: [] },
      desc: { type: String, required: true },
      historia: { type: String, default: '' },
      actividades: { type: String, default: '' },
      imagen: { type: String, required: true },
      mapEmbedUrl: { type: String, default: '' },
      lat: { type: Number },
      lng: { type: Number },
      mapsQuery: { type: String, default: '' },
      defaultSaved: { type: Boolean, default: false },
      esExperienciaHoy: { type: Boolean, default: false },
      orden: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

const DirectoryItem = mongoose.model(
  'DirectoryItem',
  new mongoose.Schema(
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
      imagen: { type: String, required: true },
      orden: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

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

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

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

module.exports = {
  Place,
  DirectoryItem,
  UserProfile,
  Culture,
  GalleryImage,
};
