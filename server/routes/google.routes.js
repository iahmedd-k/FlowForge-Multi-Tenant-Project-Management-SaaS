const router = require('express').Router();
const passport = require('passport');
const { exchangeToken, googleAuth } = require('../controllers/google.controller');

/**
 * POST /api/auth/google/token
 * Exchange authorization code for tokens (better for SPAs)
 */
router.post('/google/token', exchangeToken);

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback URL
 * Redirects to frontend with tokens on success
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleAuth
);

module.exports = router;
