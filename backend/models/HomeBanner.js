const mongoose = require('mongoose');

const HomeBannerSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, required: true },
    etiqueta: { type: String, default: 'DESTACADO', maxlength: 40 },
    titulo: { type: String, required: true, maxlength: 80 },
    subtitulo: { type: String, default: '', maxlength: 200 },
    destino: { type: String, default: 'Directorio', maxlength: 30 },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomeBanner', HomeBannerSchema);
