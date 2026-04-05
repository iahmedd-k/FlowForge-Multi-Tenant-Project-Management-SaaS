const router      = require('express').Router();
const auth        = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', auth.register);
router.post('/login',    auth.login);
router.post('/refresh',  auth.refresh);
router.post('/logout',   auth.logout);
router.get('/me',        verifyToken, auth.me);
router.put('/profile',   verifyToken, auth.updateProfile);
router.put('/password',  verifyToken, auth.changePassword);
router.get('/invite/preview', auth.previewInvite);
router.post('/invite/decline', auth.declineInvite);
router.post('/invite/accept', auth.acceptInvite);
module.exports = router;

