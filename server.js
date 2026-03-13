const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }
}));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/hub', require('./routes/hub'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neoconnect')
  .then(() => {
    console.log('MongoDB connected');
    startEscalationJob();
  })
  .catch(err => console.error('MongoDB error:', err));

// runs every hour — checks for cases with no response in 7 working days
function startEscalationJob() {
  const Case = require('./models/Case');

  cron.schedule('0 * * * *', async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const stale = await Case.find({
        status: { $in: ['Assigned', 'In Progress'] },
        lastUpdated: { $lt: sevenDaysAgo },
        escalated: { $ne: true }
      });

      for (const c of stale) {
        c.status = 'Escalated';
        c.escalated = true;
        c.escalatedAt = new Date();
        c.notes.push({
          text: 'Auto-escalated: Case Manager did not respond within 7 working days.',
          addedBy: null,
          addedAt: new Date(),
          isSystem: true
        });
        await c.save();
        console.log(`Escalated: ${c.trackingId}`);
      }
    } catch (err) {
      console.error('Escalation job error:', err);
    }
  });

  console.log('7-day escalation job running');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));