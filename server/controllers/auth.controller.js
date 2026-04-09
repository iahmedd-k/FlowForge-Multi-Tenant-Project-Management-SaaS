const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const WorkspaceMember = require('../models/WorkspaceMember');
const { ensureWorkspaceAccess } = require('../services/workspace-member.service');
const { sendPasswordResetEmail } = require('../services/email.service');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt.util');
const { success, error } = require('../utils/response.util');

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

function normalizeInviteRole(role) {
  return ['admin', 'member', 'viewer'].includes(role) ? role : 'member';
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function applyProfileFields(user, payload = {}) {
  const stringFields = [
    'jobTitle',
    'phone',
    'mobilePhone',
    'location',
    'birthday',
    'workAnniversary',
    'schedule',
    'availability',
    'workStyle',
    'language',
    'region',
    'timezone',
    'dateFormat',
    'timeFormat',
  ];

  stringFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = normalizeString(payload[field], user[field] || '');
    }
  });

  const booleanFields = [
    'notifyAssignments',
    'notifyComments',
    'notifyReminders',
    'notifyDigest',
  ];

  booleanFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = normalizeBoolean(payload[field], user[field]);
    }
  });
}

async function buildAuthPayload(userDoc, preferredWorkspaceId = null) {
  const { activeWorkspace, activeRole, workspaces } = await ensureWorkspaceAccess(
    userDoc._id,
    preferredWorkspaceId || userDoc.workspaceId
  );

  if (!activeWorkspace) {
    return { user: userDoc, workspace: null, workspaces: [], tokenPayload: null };
  }

  if (
    String(userDoc.workspaceId || '') !== String(activeWorkspace._id) ||
    userDoc.role !== activeRole
  ) {
    userDoc.workspaceId = activeWorkspace._id;
    userDoc.role = activeRole;
    await userDoc.save();
  }

  return {
    user: userDoc,
    workspace: activeWorkspace,
    workspaces,
    tokenPayload: {
      userId: userDoc._id,
      workspaceId: activeWorkspace._id,
      role: activeRole,
    },
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return error(res, 'Email is required', 400);

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return error(res, 'Email already registered');

    // Check for pending workspace invites - user should accept invite instead
    const pendingInvite = await WorkspaceInvite.findOne({
      email: normalizedEmail,
      status: 'pending',
    });
    if (pendingInvite) {
      return error(res, 'You have a pending workspace invitation. Please accept it first using the invite link sent to your email.', 400);
    }

    const userId = new mongoose.Types.ObjectId();

    // Create user WITHOUT workspace
    // Workspace will be created when user submits workspace setup form
    const user = await User.create({
      _id: userId,
      name,
      email: normalizedEmail,
      passwordHash: password,
      workspaceId: null,
      role: 'owner',
    });

    const accessToken = signAccessToken({
      userId: user._id,
      workspaceId: null,
      role: 'owner',
    });
    const refreshToken = signRefreshToken({
      userId: user._id,
    });

    return success(res, { user, workspace: null, workspaces: [], accessToken, refreshToken }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password) return error(res, 'Email and password are required', 400);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return error(res, 'Invalid credentials', 401);

    if (!user.passwordHash) return error(res, 'Invalid credentials', 401);

    const valid = await user.comparePassword(password);
    if (!valid) return error(res, 'Invalid credentials', 401);

    const authState = await buildAuthPayload(user);
    if (!authState.tokenPayload) return error(res, 'No workspace access found for this account', 403);

    const accessToken = signAccessToken(authState.tokenPayload);
    const refreshToken = signRefreshToken(authState.tokenPayload);

    return success(res, { user: authState.user, workspace: authState.workspace, workspaces: authState.workspaces, accessToken, refreshToken });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.refresh = async (req, res) => {
  try {
    // With token-based auth (no cookies), refresh is handled by client storing the accessToken
    // This endpoint is deprecated but kept for backwards compatibility
    return success(res, { message: 'Token refresh not required with header-based auth' });
  } catch {
    return error(res, 'Refresh failed', 401);
  }
};

exports.logout = (req, res) => {
  // With token-based auth, logout is handled by client deleting the token from storage
  return success(res, { message: 'Logged out' });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);
    const authState = await buildAuthPayload(user, req.user.workspaceId);
    return success(res, { user: authState.user, workspace: authState.workspace, workspaces: authState.workspaces });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);

    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) return error(res, 'Name is required', 400);
      user.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = email?.trim().toLowerCase();
      if (!normalizedEmail) return error(res, 'Email is required', 400);

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).select('_id');

      if (existingUser) return error(res, 'Email already registered', 400);
      user.email = normalizedEmail;
    }

    applyProfileFields(user, req.body);
    await user.save();

    const authState = await buildAuthPayload(user, req.user.workspaceId);
    return success(res, {
      user: authState.user,
      workspace: authState.workspace,
      workspaces: authState.workspaces,
      message: 'Profile updated',
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);

    if (!currentPassword) return error(res, 'Current password is required', 400);
    if (!newPassword || newPassword.length < 6) {
      return error(res, 'New password must be at least 6 characters', 400);
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return error(res, 'Current password is incorrect', 401);

    user.passwordHash = newPassword;
    await user.save();

    return success(res, { message: 'Password updated' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.previewInvite = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return error(res, 'Invite token is required');

    let payload;
    try {
      payload = jwt.verify(token, process.env.INVITE_TOKEN_SECRET);
    } catch {
      return error(res, 'Invite link is invalid or expired', 400);
    }

    const invite = await WorkspaceInvite.findOne({
      token,
      workspaceId: payload.workspaceId,
      email: payload.email,
    }).populate('invitedBy', 'name email');

    if (!invite) return error(res, 'Invite link is invalid or expired', 400);

    if (invite.status !== 'pending') {
      return error(
        res,
        invite.status === 'accepted' ? 'This invite has already been accepted' : 'This invite is no longer active',
        400
      );
    }

    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return error(res, 'Invite link is invalid or expired', 400);
    }

    const workspace = await Workspace.findById(payload.workspaceId).select('_id name');
    const existingUser = await User.findOne({ email: payload.email }).select('_id name email passwordHash');

    return success(res, {
      invite: {
        email: payload.email,
        role: normalizeInviteRole(payload.role),
        workspaceName: workspace?.name || 'Workspace',
        inviterName: invite.invitedBy?.name || 'A teammate',
        boardName: invite.boardName || `${workspace?.name || 'Workspace'} dashboard`,
        expiresAt: invite.expiresAt,
        existingUser: Boolean(existingUser),
        existingName: existingUser?.name || '',
        hasPassword: Boolean(existingUser?.passwordHash),
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.declineInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return error(res, 'Invite token is required');

    let payload;
    try {
      payload = jwt.verify(token, process.env.INVITE_TOKEN_SECRET);
    } catch {
      return error(res, 'Invite link is invalid or expired', 400);
    }

    const invite = await WorkspaceInvite.findOne({
      token,
      workspaceId: payload.workspaceId,
      email: payload.email,
      status: 'pending',
    });

    if (!invite) return error(res, 'Invite is no longer active', 400);

    invite.status = 'declined';
    await invite.save();

    return success(res, { message: 'Invitation declined' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { token, name, email, password } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.INVITE_TOKEN_SECRET);
    } catch {
      return error(res, 'Invite link is invalid or expired', 400);
    }

    const { email: invitedEmail, workspaceId } = payload;
    const role = normalizeInviteRole(payload.role);

    if (email && email.trim().toLowerCase() !== invitedEmail) {
      return error(res, 'Email does not match the invitation', 400);
    }

    // Check if workspace exists and verify billing limits
    const workspace = await Workspace.findById(workspaceId).select('subscriptionTier members');
    if (!workspace) {
      return error(res, 'Workspace not found', 404);
    }

    // Check team member billing limit
    const { isLimitExceeded, BILLING_LIMITS } = require('../utils/billingLimits');
    const currentMemberCount = workspace.members?.length || 0;
    const tier = workspace.subscriptionTier || 'free';
    
    if (isLimitExceeded(tier, 'teamMembers', currentMemberCount)) {
      const limits = BILLING_LIMITS[tier];
      return error(
        res,
        `This workspace has reached the maximum team members (${limits.teamMembers}) for the ${tier} plan. Please ask the workspace admin to upgrade.`,
        403
      );
    }

    const invite = await WorkspaceInvite.findOne({
      token,
      workspaceId,
      email: invitedEmail,
      status: 'pending',
    });

    if (!invite) return error(res, 'Invite link is invalid or already used', 400);
    if (invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return error(res, 'Invite link is invalid or expired', 400);
    }

    let user = await User.findOne({ email: invitedEmail });
    let preferredWorkspaceId = workspaceId;

    if (user) {
      // User exists - check if they have a password (email/password auth) or only Google auth
      if (user.passwordHash) {
        // Email/password user - validate password
        if (!password || password.length < 6) return error(res, 'Password must be at least 6 characters', 400);
        const valid = await user.comparePassword(password);
        if (!valid) return error(res, 'Invalid password for this invited email', 401);
      }
      // For Google-only users (no passwordHash), just accept invite without password validation
      if (name?.trim()) user.name = name.trim();
      await user.save();
    } else {
      // New user - require name and password
      if (!name?.trim()) return error(res, 'Name is required', 400);
      if (!password || password.length < 6) return error(res, 'Password must be at least 6 characters', 400);
      const userId = new mongoose.Types.ObjectId();
      const personalWorkspaceId = new mongoose.Types.ObjectId();

      await Workspace.create({
        _id: personalWorkspaceId,
        name: `${name.trim()}'s Workspace`,
        description: '',
        setupCompleted: false,
        ownerId: userId,
      });

      user = await User.create({
        _id: userId,
        name: name.trim(),
        email: invitedEmail,
        passwordHash: password,
        workspaceId: personalWorkspaceId,
        role: 'owner',
      });

      await WorkspaceMember.create({
        workspaceId: personalWorkspaceId,
        userId,
        role: 'owner',
      });

      preferredWorkspaceId = personalWorkspaceId;
    }

    await WorkspaceMember.findOneAndUpdate(
      { userId: user._id, workspaceId },
      {
        userId: user._id,
        workspaceId,
        role,
        invitedBy: invite.invitedBy || null,
        joinedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );

    const authState = await buildAuthPayload(user, preferredWorkspaceId);
    const accessToken = signAccessToken(authState.tokenPayload);
    const refreshToken = signRefreshToken(authState.tokenPayload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();

    return success(res, { user: authState.user, workspace: authState.workspace, workspaces: authState.workspaces }, 201);
  } catch (err) {
    console.error('[accept-invite-error]', {
      error: err.message,
      code: err.code,
      errorName: err.constructor.name,
      details: err.errmsg || err.message,
    });

    // Handle MongoDB duplicate key error specifically
    if (err.code === 11000) {
      return error(res, 'This user is already registered. Please log in instead.', 400);
    }

    return error(res, err.message || 'Unable to accept invitation', 500);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return error(res, 'Email is required', 400);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists for security
      return success(res, { message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Create reset token valid for 1 hour
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: 'password-reset',
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    await sendPasswordResetEmail({
      to: user.email,
      token,
    }).catch((err) => {
      console.error('[forgot-password-email-error]', {
        email: user.email,
        userId: user._id,
        error: err.message,
      });
    });

    return success(res, { message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) return error(res, 'Reset token is required', 400);
    if (!password || password.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return error(res, 'Password reset link is invalid or expired', 400);
    }

    if (payload.type !== 'password-reset') {
      return error(res, 'Invalid token type', 400);
    }

    const user = await User.findById(payload.userId);
    if (!user) return error(res, 'User not found', 404);

    if (user.email !== payload.email) {
      return error(res, 'Token does not match user email', 400);
    }

    user.passwordHash = password;
    await user.save();

    return success(res, { message: 'Password has been reset successfully' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
