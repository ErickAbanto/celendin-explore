require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Place, Culture, GalleryImage } = require('./models');
const { places, culture, gallery } = require('./data');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Carpeta pública de imágenes servidas desde el backend: http://<host>:3000/images/<archivo>.jpg
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

let mongoActivo = false;

function withFullImageUrl(req, item) {
  const obj = item.toObject ? item.toObject() : { ...item };
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (obj.imagen && obj.imagen.startsWith('/')) {
    obj.imagenUrl = `${baseUrl}${obj.imagen}`;
  }
  return obj;
}

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, app: 'Celendín Explore API', db: mongoActivo ? 'mongodb' : 'embedded-json' })
);

app.get('/api/places', async (req, res) => {
  try {
    const list = mongoActivo ? await Place.find().sort({ orden: 1 }) : places;
    res.json(
      list.map((doc) => {
        const obj = withFullImageUrl(req, doc);
        const localMatch = places.find((p) => p.nombre === obj.nombre);
        if (localMatch) {
          obj.mapEmbedUrl = localMatch.mapEmbedUrl || obj.mapEmbedUrl || '';
        }
        return obj;
      })
    );
  } catch (e) {
    res.json(places.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.get('/api/culture', async (req, res) => {
  try {
    const list = mongoActivo ? await Culture.find().sort({ orden: 1 }) : culture;
    res.json(list.map((doc) => withFullImageUrl(req, doc)));
  } catch (e) {
    res.json(culture.map((doc) => withFullImageUrl(req, doc)));
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const list = mongoActivo ? await GalleryImage.find().sort({ orden: 1 }) : gallery;
    res.json(list.map((doc) => withFullImageUrl(req, doc)));
  } catch (e) {
    res.json(gallery.map((doc) => withFullImageUrl(req, doc)));
  }
});

const PORT = process.env.PORT || 3000;

function iniciarServidor() {
  const srv = app.listen(PORT, '0.0.0.0', () =>
    console.log(`API e Imágenes en http://0.0.0.0:${PORT} (DB: ${mongoActivo ? 'MongoDB' : 'JSON integrado'})`)
  );
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`API ya está activa en el puerto ${PORT}`);
    } else {
      console.error('Error en servidor:', err.message);
    }
  });
}

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 })
  .then(async () => {
    mongoActivo = true;
    console.log('MongoDB conectado (Celendín Explore)');
    const count = await Place.countDocuments();
    if (count === 0) {
      await Place.insertMany(places);
      await Culture.insertMany(culture);
      await GalleryImage.insertMany(gallery);
      console.log('Datos iniciales de Celendín Explore cargados en MongoDB');
    }
    iniciarServidor();
  })
  .catch((e) => {
    console.warn('MongoDB no disponible, usando base de datos JSON integrada sin costo:', e.message);
    iniciarServidor();
  });
