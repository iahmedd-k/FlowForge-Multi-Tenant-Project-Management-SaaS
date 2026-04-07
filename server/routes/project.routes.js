const router             = require('express').Router();
const ctrl               = require('../controllers/project.controller');
const verifyToken        = require('../middleware/verifyToken');
const checkRole          = require('../middleware/checkRole');
const tenantScope        = require('../middleware/tenantScope');
const checkBillingLimit  = require('../middleware/checkBillingLimit');

router.use(verifyToken, tenantScope);

router.get('/',                        ctrl.getProjects);
router.post('/',                       checkRole('owner', 'admin'), checkBillingLimit, ctrl.createProject);
router.get('/:id',                     ctrl.getProjectById);
router.put('/:id',                     checkRole('owner', 'admin'), ctrl.updateProject);
router.delete('/:id',                  checkRole('owner'),          ctrl.deleteProject);
router.post('/:id/members',            checkRole('owner', 'admin'), ctrl.addMember);
router.delete('/:id/members/:userId',  checkRole('owner', 'admin'), ctrl.removeMember);

module.exports = router;