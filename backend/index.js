require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/db');
const { HomeBanner, EmergencyNumber, TransportAgency } = require('./models');
const {
  sanitizeBanner,
  sanitizeEmergency,
  sanitizeTransport,
} = require('./utils/sanitizers');
const { createCatalogCrudRouter } = require('./routes/catalogCrud.routes');
const placesRoutes = require('./routes/places.routes');
const directoryRoutes = require('./routes/directory.routes');
const profileRoutes = require('./routes/profile.routes');
const contentRoutes = require('./routes/content.routes');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rutas de API
app.use('/api', contentRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/profile', profileRoutes);
app.use(
  '/api/banners',
  createCatalogCrudRouter({
    Model: HomeBanner,
    prefix: 'home',
    sanitize: sanitizeBanner,
    required: ['titulo'],
  })
);
app.use(
  '/api/emergencies',
  createCatalogCrudRouter({
    Model: EmergencyNumber,
    prefix: 'sos',
    sanitize: sanitizeEmergency,
    required: ['titulo', 'numero'],
  })
);
app.use(
  '/api/transport',
  createCatalogCrudRouter({
    Model: TransportAgency,
    prefix: 'bus',
    sanitize: sanitizeTransport,
    required: ['empresa', 'ruta', 'terminal'],
  })
);

const PORT = process.env.PORT || 3000;

function iniciarServidor() {
  const srv = app.listen(PORT, '0.0.0.0', () =>
    console.log(`API conectada 100% a MongoDB Atlas en http://0.0.0.0:${PORT}`)
  );
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`API ya está activa en el puerto ${PORT}`);
    } else {
      console.error('Error en servidor:', err.message);
    }
  });
}

connectDatabase()
  .then(() => iniciarServidor())
  .catch((e) => {
    console.error('Error conectando a MongoDB Atlas:', e.message);
    iniciarServidor();
  });
