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

const PlaceSchema = new mongoose.Schema(
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
    imagen: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number },
    mapsQuery: { type: String, default: '' },
    defaultSaved: { type: Boolean, default: false },
    esExperienciaHoy: { type: Boolean, default: false },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', PlaceSchema);
