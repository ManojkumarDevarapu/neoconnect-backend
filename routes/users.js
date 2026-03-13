const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) query.role = role;

    // Secretariat can only pull Case Managers for assignment dropdown
    if (req.user.role === 'Secretariat') {
      query.role = 'Case Manager';
    }

    const users = await User.find(query).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = new User({ name, email, password, role, department });
    await user.save();

    const { password: _, ...data } = user.toObject();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    const { name, role, department, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, department, isActive },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;