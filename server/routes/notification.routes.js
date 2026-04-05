
const router      = require('express').Router();
const ctrl        = require('../controllers/notification.controller');
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');

router.use(verifyToken, tenantScope);

router.get('/',             ctrl.getNotifications);   // get all for current user
router.patch('/:id/read',   ctrl.markOneRead);        // mark single as read
router.patch('/read-all',   ctrl.markAllRead);        // mark all as read
router.delete('/:id',       ctrl.deleteNotification); // delete single
router.delete('/',          ctrl.clearAll);           // clear all read ones

module.exports = router;