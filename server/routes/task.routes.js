const router      = require('express').Router();
const ctrl        = require('../controllers/task.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');
const tenantScope = require('../middleware/tenantScope');

router.use(verifyToken, tenantScope);

router.get('/',                          ctrl.getTasks);
router.post('/upload',                   checkRole('owner', 'admin', 'member'), ctrl.uploadAttachment);
router.post('/',                         checkRole('owner', 'admin', 'member'), ctrl.createTask);
router.get('/:id',                       ctrl.getTaskById);
router.put('/:id',                       checkRole('owner', 'admin', 'member'), ctrl.updateTask);
router.patch('/:id/status',              checkRole('owner', 'admin', 'member'), ctrl.updateStatus);
router.delete('/:id',                    checkRole('owner', 'admin'),           ctrl.deleteTask);
router.post('/:id/comments',             checkRole('owner', 'admin', 'member', 'viewer'), ctrl.addComment);
router.delete('/:id/comments/:commentId',checkRole('owner', 'admin', 'member', 'viewer'), ctrl.deleteComment);

module.exports = router;
