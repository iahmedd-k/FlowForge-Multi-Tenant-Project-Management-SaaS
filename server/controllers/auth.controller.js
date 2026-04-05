const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const WorkspaceMember = require('../models/WorkspaceMember');
const { ensureWorkspaceAccess } = require('../services/workspace-member.service');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt.util');
const { success, error } = require('../utils/response.util');

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
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

    const exists = await User.findOne({ email });
    if (exists) return error(res, 'Email already registered');

    const userId = new mongoose.Types.ObjectId();
    const workspaceId = new mongoose.Types.ObjectId();

    const workspace = await Workspace.create({
      _id: workspaceId,
      name: `${name}'s Workspace`,
      description: '',
      setupCompleted: false,
      ownerId: userId,
    });

    const user = await User.create({
      _id: userId,
      name,
      email,
      passwordHash: password,
      workspaceId,
      role: 'owner',
    });

    await WorkspaceMember.create({
      workspaceId,
      userId,
      role: 'owner',
    });

    const authState = await buildAuthPayload(user, workspaceId);
    const accessToken = signAccessToken(authState.tokenPayload);
    const refreshToken = signRefreshToken(authState.tokenPayload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return success(res, { user: authState.user, workspace: authState.workspace, workspaces: authState.workspaces }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, 'Invalid credentials', 401);

    const valid = await user.comparePassword(password);
    if (!valid) return error(res, 'Invalid credentials', 401);

    const authState = await buildAuthPayload(user);
    if (!authState.tokenPayload) return error(res, 'No workspace access found for this account', 403);

    const accessToken = signAccessToken(authState.tokenPayload);
    const refreshToken = signRefreshToken(authState.tokenPayload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return success(res, { user: authState.user, workspace: authState.workspace, workspaces: authState.workspaces });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return error(res, 'No refresh token', 401);

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user) return error(res, 'User not found', 404);

    const authState = await buildAuthPayload(user, payload.workspaceId);
    if (!authState.tokenPayload) return error(res, 'No workspace access found for this account', 403);

    const accessToken = signAccessToken(authState.tokenPayload);
    const refreshToken = signRefreshToken(authState.tokenPayload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return success(res, { message: 'Token refreshed' });
  } catch {
    return error(res, 'Invalid refresh token', 401);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken', cookieOpts);
  res.clearCookie('refreshToken', cookieOpts);
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

    const workspace = await Workspace.findById(payload.workspaceId).select('name');
    const existingUser = await User.findOne({ email: payload.email }).select('_id name email');

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
      if (!password || password.length < 6) return error(res, 'Password must be at least 6 characters', 400);
      const valid = await user.comparePassword(password);
      if (!valid) return error(res, 'Invalid password for this invited email', 401);
      if (name?.trim()) user.name = name.trim();
      await user.save();
    } else {
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
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
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
    return error(res, err.message, 500);
  }
};
