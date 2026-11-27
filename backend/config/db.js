const mongoose = require('mongoose');
const { Place, DirectoryItem } = require('../models');

async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('MongoDB Atlas conectado en la nube (Celendín Explore)');
  // Limpia cualquier referencia antigua a /images/ en la nube
  await Place.updateMany(
    { imagen: { $regex: '^/images/' } },
    { $set: { imagen: '' } }
  );
  await DirectoryItem.updateMany(
    { imagen: { $regex: '^/images/' } },
    { $set: { imagen: '' } }
  );
}

module.exports = { connectDatabase };
