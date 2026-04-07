const router = require('express').Router();
const ctrl = require('../controllers/calendar.controller');
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');

// Public route - no auth required (token acts as secret)
router.get('/feed/:token', ctrl.getFeed);

// Protected routes - require authentication
router.use(verifyToken, tenantScope);

router.post('/generate-feed-token', ctrl.generateFeedToken);
router.delete('/revoke-feed-token', ctrl.revokeFeedToken);
router.get('/token-status', ctrl.getTokenStatus);

router.get('/export/task/:taskId', ctrl.exportTask);
router.get('/export/project/:projectId', ctrl.exportProject);

module.exports = router;
