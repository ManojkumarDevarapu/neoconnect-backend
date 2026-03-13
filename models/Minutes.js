const mongoose = require('mongoose');

const minutesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Minutes', minutesSchema);