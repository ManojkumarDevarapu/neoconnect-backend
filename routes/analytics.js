const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { auth, requireRole } = require('../middleware/auth');

router.get('/overview', auth, requireRole('Secretariat', 'Admin'), async (req, res) => {
  try {
    const byStatus = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byCategory = await Case.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const byDepartment = await Case.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const bySeverity = await Case.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const hotspots = await Case.aggregate([
      {
        $group: {
          _id: { department: '$department', category: '$category' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } }
    ]);

    // open cases by dept — with highestSeverity for heatmap colouring
    const openByDept = await Case.aggregate([
      { $match: { status: { $nin: ['Resolved'] } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          severities: { $push: '$severity' }
        }
      },
      {
        $addFields: {
          highestSeverity: {
            $cond: {
              if: { $in: ['High', '$severities'] },
              then: 'High',
              else: {
                $cond: {
                  if: { $in: ['Medium', '$severities'] },
                  then: 'Medium',
                  else: 'Low'
                }
              }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await Case.countDocuments();
    const open = await Case.countDocuments({ status: { $nin: ['Resolved'] } });
    const escalated = await Case.countDocuments({ status: 'Escalated' });

    res.json({ total, open, escalated, byStatus, byCategory, byDepartment, bySeverity, hotspots, openByDept });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;