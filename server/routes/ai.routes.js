const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');

router.use(verifyToken, tenantScope);

router.post('/assistant', ctrl.askAssistant);

module.exports = router;
