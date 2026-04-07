const router      = require('express').Router();
const ctrl        = require('../controllers/billing.controller');
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');
const checkRole   = require('../middleware/checkRole');

// webhook must be BEFORE express.json() middleware — needs raw body
// we handle that in server.js separately

// all other billing routes need auth
router.use(verifyToken, tenantScope);

router.get('/plans',           ctrl.getPlans);
router.get('/status',          ctrl.getBillingStatus);
router.get('/usage',           ctrl.getWorkspaceUsage);
router.post('/checkout',       checkRole('owner'), ctrl.createCheckout);
router.post('/portal',         checkRole('owner'), ctrl.openPortal);

module.exports = router;