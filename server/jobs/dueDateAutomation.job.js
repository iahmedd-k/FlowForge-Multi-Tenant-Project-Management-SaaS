const cron = require('node-cron');
const { runDueDateAutomations } = require('../utils/automationExecutor');

function startDueDateJob() {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running due date automations...');
    await runDueDateAutomations().catch((err) => {
      console.error('[Cron] Due date automations failed:', err.message);
    });
  });
}

module.exports = { startDueDateJob };
