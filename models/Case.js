const mongoose = require('mongoose');

async function generateTrackingId() {
  const year = new Date().getFullYear();
  const prefix = `NEO-${year}-`;

  const last = await mongoose.model('Case').findOne(
    { trackingId: { $regex: `^${prefix}` } },
    {},
    { sort: { createdAt: -1 } }
  );

  let next = 1;
  if (last) {
    const parts = last.trackingId.split('-');
    next = parseInt(parts[2]) + 1;
  }

  return `${prefix}${String(next).padStart(3, '0')}`;
}

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
  isSystem: { type: Boolean, default: false }
});

const caseSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true },
  category: {
    type: String,
    enum: ['Safety', 'Policy', 'Facilities', 'HR', 'Other'],
    required: true
  },
  department: { type: String, required: true },
  location: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  description: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'],
    default: 'New'
  },
  notes: [noteSchema],
  attachments: [{ filename: String, originalName: String, path: String }],
  escalated: { type: Boolean, default: false },
  escalatedAt: Date,
  resolvedAt: Date,
  actionTaken: { type: String, default: '' },
  whatChanged: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

caseSchema.pre('save', async function (next) {
  if (!this.trackingId) {
    this.trackingId = await generateTrackingId();
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Case', caseSchema);