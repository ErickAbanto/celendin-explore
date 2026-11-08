require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const { Place, Culture, GalleryImage } = require('./models');
const { places, culture, gallery } = require('./data');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Place.deleteMany({});
  await Culture.deleteMany({});
  await GalleryImage.deleteMany({});
  await Place.insertMany(places);
  await Culture.insertMany(culture);
  await GalleryImage.insertMany(gallery);
  console.log(`Seed Celendín Explore listo: ${places.length} atractivos, ${culture.length} temas culturales, ${gallery.length} imágenes`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error('Error en seed:', e.message);
  process.exit(1);
});
