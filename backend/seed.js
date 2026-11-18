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

  await Place.insertMany(places);
  await DirectoryItem.insertMany(directory);
  await Culture.insertMany(culture);
  await GalleryImage.insertMany(gallery);

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
