require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const {
  Place,
  DirectoryItem,
  UserProfile,
  Culture,
  GalleryImage,
} = require('./models');
const {
  places,
  directory,
  culture,
  gallery,
  defaultProfile,
} = require('./data');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Place.deleteMany({});
  await DirectoryItem.deleteMany({});
  await Culture.deleteMany({});
  await GalleryImage.deleteMany({});

  await Place.insertMany(places.map((p) => ({ ...p, imagen: '' })));
  await DirectoryItem.insertMany(directory.map((d) => ({ ...d, imagen: '' })));
  await Culture.insertMany(culture.map((c) => ({ ...c, imagen: '' })));
  await GalleryImage.insertMany(gallery.map((g) => ({ ...g, imagen: '' })));

  await UserProfile.updateOne(
    { deviceId: defaultProfile.deviceId },
    { $setOnInsert: defaultProfile },
    { upsert: true }
  );

  console.log(
    `Seed Celendín Explore listo: ${places.length} atractivos, ${directory.length} locales en directorio, ${culture.length} temas culturales, ${gallery.length} imágenes`
  );
  await mongoose.disconnect();
})().catch((e) => {
  console.error('Error en seed:', e.message);
  process.exit(1);
});
