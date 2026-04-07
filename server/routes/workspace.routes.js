const router             = require('express').Router();
const ctrl               = require('../controllers/workspace.controller');
const verifyToken        = require('../middleware/verifyToken');
const checkRole          = require('../middleware/checkRole');
const tenantScope        = require('../middleware/tenantScope');
const checkBillingLimit  = require('../middleware/checkBillingLimit');

// switching workspaces only needs authentication; it establishes the next tenant context.
router.post('/switch', verifyToken, ctrl.switchWorkspace);
router.post('/create', verifyToken, checkBillingLimit, ctrl.createWorkspace);

// all remaining workspace routes require login plus an active tenant context
router.use(verifyToken, tenantScope);

router.get('/',                ctrl.getWorkspace);
router.get('/list',            ctrl.listUserWorkspaces);
router.put('/',                checkRole('owner', 'admin'), ctrl.updateWorkspace);
router.post('/invite',         checkRole('owner', 'admin'), checkBillingLimit, ctrl.inviteUser);
router.get('/invitations',     checkRole('owner', 'admin'), ctrl.getInvitations);
router.get('/members',         ctrl.getMembers);
router.put('/members/:userId', checkRole('owner'),          ctrl.updateMemberRole);
router.delete('/members/:userId', checkRole('owner'),       ctrl.removeMember);
router.delete('/invitations/:inviteId', checkRole('owner', 'admin'), ctrl.cancelInvitation);

module.exports = router;
