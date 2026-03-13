const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Case = require('../models/Case');
const Minutes = require('../models/Minutes');
const { auth, requireRole } = require('../middleware/auth');

// quarterly digest — resolved public cases
router.get('/digest', auth, async (req, res) => {
  try {
    const { quarter, year } = req.query;
    let query = { status: 'Resolved', isPublic: true };

    if (year && quarter) {
      const qMap = { '1': [0, 2], '2': [3, 5], '3': [6, 8], '4': [9, 11] };
      const months = qMap[quarter];
      if (months) {
        query.resolvedAt = {
          $gte: new Date(year, months[0], 1),
          $lte: new Date(year, months[1] + 1, 0, 23, 59, 59)
        };
      }
    }

    const cases = await Case.find(query)
      .select('trackingId category department severity description actionTaken whatChanged resolvedAt')
      .sort({ resolvedAt: -1 })
      .limit(50);

    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// impact tracking table
router.get('/impact', auth, async (req, res) => {
  try {
    const cases = await Case.find({
      status: 'Resolved',
      isPublic: true,
      actionTaken: { $ne: '' }
    })
      .select('trackingId category department description actionTaken whatChanged resolvedAt')
      .sort({ resolvedAt: -1 });

    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// searchable minutes archive
router.get('/minutes', auth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const minutes = await Minutes.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(minutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/minutes', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.document;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'minutes');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    await file.mv(path.join(uploadDir, filename));

    const minutes = new Minutes({
      title,
      description: description || '',
      filename,
      originalName: file.name,
      path: `/uploads/minutes/${filename}`,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    await minutes.save();
    res.status(201).json(minutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/minutes/:id', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    await Minutes.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;