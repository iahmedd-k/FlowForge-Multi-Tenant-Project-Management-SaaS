const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const { ensureWorkspaceAccess } = require('../services/workspace-member.service');
const {
  signAccessToken,
  signRefreshToken,
} = require('../utils/jwt.util');
const { success, error } = require('../utils/response.util');

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

/**
 * Exchange Google Authorization Code for tokens
 * POST /api/auth/google/token
 */
async function exchangeToken(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return error(res, 'Authorization code is required', 400);
    }

    // The redirect_uri must match what was used when generating the authorization code
    // (i.e., the frontend callback URL, not the backend URL)
    // Remove trailing slash from CLIENT_URL to ensure proper matching
    const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    const redirectUri = `${clientUrl}/auth/google-callback`;

    // Exchange code for tokens with Google
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const { id_token, access_token } = tokenResponse.data;

    // Decode ID token to get user info
    const decoded = jwt.decode(id_token);
    const { email, given_name, family_name, picture, sub: googleId } = decoded;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user WITHOUT workspace
      // Workspace will be created when user submits workspace setup form
      user = new User({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        avatar: picture,
        googleId,
        isVerified: true,
        workspaceId: null,
        role: 'owner',
      });

      await user.save();
    } else {
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }
    }

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user._id,
      workspaceId: user.workspaceId,
      role: user.role,
    });

    const refreshToken = signRefreshToken({
      userId: user._id,
    });

    // Get workspace info
    const { activeWorkspace, activeRole, workspaces } = await ensureWorkspaceAccess(
      user._id,
      user.workspaceId
    );

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, cookieOpts);

    return success(res, {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
      },
      workspace: activeWorkspace,
      workspaces,
    }, 200);
  } catch (err) {
    console.error('Google token exchange error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    return error(res, 'Google authentication failed: ' + (err.response?.data?.error_description || err.message), 500);
  }
}

/**
 * Google OAuth Callback Handler (with passport)
 * Called after successful Google authentication
 */
async function googleAuth(req, res) {
  try {
    if (!req.user) {
      return error(res, 'Authentication failed', 401);
    }

    // Generate tokens
    const accessToken = signAccessToken({
      userId: req.user._id,
      workspaceId: req.user.workspaceId,
      role: req.user.role,
    });

    const refreshToken = signRefreshToken({
      userId: req.user._id,
    });

    // Get or build auth payload
    const { activeWorkspace, activeRole, workspaces } = await ensureWorkspaceAccess(
      req.user._id,
      req.user.workspaceId
    );

    // Update user with workspace info
    if (String(req.user.workspaceId || '') !== String(activeWorkspace._id)) {
      req.user.workspaceId = activeWorkspace._id;
      req.user.role = activeRole;
      await req.user.save();
    }

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, cookieOpts);

    // Return tokens and user data
    return success(res, {
      accessToken,
      refreshToken,
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: req.user.avatar,
        role: req.user.role,
      },
      workspace: activeWorkspace,
      workspaces,
    }, 200);
  } catch (err) {
    console.error('Google auth error:', err);
    return error(res, 'Google authentication failed', 500);
  }
}

module.exports = {
  exchangeToken,
  googleAuth,
};
