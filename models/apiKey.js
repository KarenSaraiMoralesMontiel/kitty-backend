const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  key: { type: String, required: true }, // Hashed key (SHA-256)
  clientName: { type: String, required: true }, // e.g., "Telegram Bot", "Frontend App"
  role: { type: String, enum: ['viewer', 'uploader', 'admin'], required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);