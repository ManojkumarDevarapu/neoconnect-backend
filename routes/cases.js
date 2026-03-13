const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Case = require('../models/Case');
const { auth, requireRole } = require('../middleware/auth');

// Staff sees their own, Case Manager sees assigned, Secretariat/Admin see all
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    const { status, category, department, severity } = req.query;

    if (req.user.role === 'Staff') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'Case Manager') {
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (department) query.department = department;
    if (severity) query.severity = severity;

    const cases = await Case.find(query)
      .populate('assignedTo', 'name email')
      .populate('submittedBy', 'name email')
      .populate('notes.addedBy', 'name')
      .sort({ createdAt: -1 });

    const result = cases.map(c => {
      const obj = c.toObject();
      if (obj.isAnonymous && !['Secretariat', 'Admin'].includes(req.user.role)) {
        obj.submittedBy = null;
      }
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Case.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('submittedBy', 'name email department')
      .populate('notes.addedBy', 'name role');

    if (!c) return res.status(404).json({ message: 'Case not found' });

    const obj = c.toObject();
    if (obj.isAnonymous && !['Secretariat', 'Admin'].includes(req.user.role)) {
      obj.submittedBy = null;
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { category, department, location, severity, description, isAnonymous } = req.body;

    const newCase = new Case({
      category,
      department,
      location,
      severity,
      description,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      submittedBy: req.user._id
    });

    if (req.files && req.files.attachment) {
      const file = req.files.attachment;
      const uploadDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      await file.mv(path.join(uploadDir, filename));

      newCase.attachments.push({
        filename,
        originalName: file.name,
        path: `/uploads/${filename}`
      });
    }

    await newCase.save();
    res.status(201).json(newCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Secretariat assigns a case manager
router.patch('/:id/assign', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const c = await Case.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'Assigned', lastUpdated: new Date() },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!c) return res.status(404).json({ message: 'Case not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Case Manager / Secretariat update status
router.patch('/:id/status', auth, requireRole('Case Manager', 'Secretariat', 'Admin'), async (req, res) => {
  try {
    const { status, note, actionTaken, whatChanged, isPublic } = req.body;

    const c = await Case.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Case not found' });

    if (req.user.role === 'Case Manager' && String(c.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not your case' });
    }

    if (status) c.status = status;
    c.lastUpdated = new Date();

    if (status === 'Resolved') {
      c.resolvedAt = new Date();
      if (actionTaken) c.actionTaken = actionTaken;
      if (whatChanged) c.whatChanged = whatChanged;
      if (isPublic !== undefined) c.isPublic = isPublic;
    }

    if (note) {
      c.notes.push({ text: note, addedBy: req.user._id });
    }

    await c.save();
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;