const cron = require('node-cron');
const { runProjectDeadlineWarnings } = require('../utils/automationExecutor');

function startProjectDeadlineJob() {
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running project deadline automations...');
    await runProjectDeadlineWarnings().catch((err) => {
      console.error('[Cron] Project deadline automations failed:', err.message);
    });
  });
}

module.exports = { startProjectDeadlineJob };
