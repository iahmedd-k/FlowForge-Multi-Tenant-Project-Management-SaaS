require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('./config/passport');
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
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// HEALTH CHECK ENDPOINT - COLD START WAKE-UP
// ============================================================================
// This endpoint is used to wake up the server on Render's free tier
// To remove this functionality:
// 1. Delete this entire health check route (lines below)
// 2. Remove the corresponding fetch call in client/src/pages/Index.tsx
// 
// The endpoint simply returns a 200 status to keep the server active
// during the client's session before they attempt to login/signup
// ============================================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// END OF HEALTH CHECK ENDPOINT
// ============================================================================

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth', require('./routes/google.routes'));
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

    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();
