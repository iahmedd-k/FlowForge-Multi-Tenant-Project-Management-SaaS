const router = require('express').Router();
const ctrl = require('../controllers/slack.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const tenantScope = require('../middleware/tenantScope');

// All routes require authentication and workspace validation
router.use(verifyToken, tenantScope);

// Only Owner and Admin can configure Slack integration
router.post('/save', checkRole('owner', 'admin'), ctrl.saveWebhook);
router.delete('/remove', checkRole('owner', 'admin'), ctrl.removeWebhook);
router.post('/test', checkRole('owner', 'admin'), ctrl.testWebhook);

// Any authenticated user can check status
router.get('/status', ctrl.getStatus);

module.exports = router;
