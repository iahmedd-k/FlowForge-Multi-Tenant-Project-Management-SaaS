require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const stripeService = require('./services/stripe.service');
const { error } = require('./utils/response.util');
const { startDueDateJob } = require('./jobs/dueDateAutomation.job');
const { startProjectDeadlineJob } = require('./jobs/projectDeadlineAutomation.job');

const app = express();

app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    try {
      await stripeService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (err) {
      console.error('[stripe webhook error]', err.message);
      return res.status(400).json({ error: err.message });
    }
  }
);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/workspace', require('./routes/workspace.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/timelogs', require('./routes/timeLog.routes'));
app.use('/api/automations', require('./routes/automation.routes'));
app.use('/api/integrations/slack', require('./routes/slack.routes'));
app.use('/api/integrations/calendar', require('./routes/calendar.routes'));

app.use((req, res) => error(res, 'Route not found', 404));

const startServer = async () => {
  try {
    await connectDB();
    startDueDateJob();
    startProjectDeadlineJob();

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();
