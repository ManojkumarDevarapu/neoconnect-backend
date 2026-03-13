const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Need a question and at least 2 options' });
    }

    const poll = new Poll({
      question,
      options: options.map(text => ({ text, votes: [] })),
      createdBy: req.user._id
    });

    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll || !poll.isActive) {
      return res.status(404).json({ message: 'Poll not found or closed' });
    }

    const alreadyVoted = poll.options.some(o => o.votes.includes(req.user._id));
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    poll.options[optionIndex].votes.push(req.user._id);
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/close', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!poll) return res.status(404).json({ message: 'Not found' });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    await Poll.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;