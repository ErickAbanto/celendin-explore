const mongoose = require('mongoose');

const AppMetaSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  version: { type: Number, default: 0 },
});

module.exports = mongoose.model('AppMeta', AppMetaSchema);
