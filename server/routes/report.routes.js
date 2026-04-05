const router      = require('express').Router();
const ctrl        = require('../controllers/report.controller');
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');

router.use(verifyToken, tenantScope);

router.get('/summary',  ctrl.getSummary);   // all 5 metrics in one call
router.get('/workload', ctrl.getWorkload);  // per user open task count
router.get('/trend',    ctrl.getTrend);     // daily completions last 30 days
router.get('/overdue',  ctrl.getOverdue);   // full overdue task list

module.exports = router;