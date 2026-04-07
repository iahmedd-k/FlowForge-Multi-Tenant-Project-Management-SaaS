const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../utils/jwt.util');
const { error } = require('../utils/response.util');
const User = require('../models/User');
const { ensureWorkspaceAccess } = require('../services/workspace-member.service');

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

module.exports = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    return error(res, 'Not authenticated', 401);
  }

  try {
    if (accessToken) {
      req.user = verifyAccessToken(accessToken);
      return next();
    }
  } catch {
    // fall through to refresh-token recovery below
  }

  try {
    if (!refreshToken) {
      return error(res, 'Token invalid or expired', 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const { activeWorkspace, activeRole } = await ensureWorkspaceAccess(
      user._id,
      payload.workspaceId || user.workspaceId
    );
    if (!activeWorkspace) {
      return error(res, 'No workspace access found for this account', 403);
    }

    if (
      String(user.workspaceId || '') !== String(activeWorkspace._id) ||
      user.role !== activeRole
    ) {
      user.workspaceId = activeWorkspace._id;
      user.role = activeRole;
      await user.save();
    }

    const refreshedPayload = {
      userId: user._id,
      workspaceId: activeWorkspace._id,
      role: activeRole,
    };
    const refreshedAccessToken = signAccessToken(refreshedPayload);
    const refreshedRefreshToken = signRefreshToken(refreshedPayload);

    res.cookie('accessToken', refreshedAccessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshedRefreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    req.user = refreshedPayload;
    return next();
  } catch {
    return error(res, 'Token invalid or expired', 401);
  }
};
