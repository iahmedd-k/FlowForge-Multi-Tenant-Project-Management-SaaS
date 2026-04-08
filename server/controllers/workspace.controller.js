const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const WorkspaceInvite = require('../models/WorkspaceInvite');
const WorkspaceMember = require('../models/WorkspaceMember');
const { sendInviteEmail } = require('../services/email.service');
const { success, error } = require('../utils/response.util');
const { getUserWorkspaces, ensureWorkspaceAccess } = require('../services/workspace-member.service');
const { signAccessToken, signRefreshToken } = require('../utils/jwt.util');
const {
  getActiveRole,
  isOwner,
  isWorkspaceManager,
  getAccessibleProjectIds,
} = require('../services/access.service');

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

function normalizeManagedRole(role, actorRole) {
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'member';

  if (actorRole === 'owner' && ['admin', 'member', 'viewer'].includes(normalizedRole)) {
    return normalizedRole;
  }

  if (actorRole === 'admin' && ['member', 'viewer'].includes(normalizedRole)) {
    return normalizedRole;
  }

  return null;
}

function isEmailTransportError(err) {
  const message = String(err?.message || '');
  const code = String(err?.code || '');
  return Boolean(
    err?.responseCode ||
    err?.code === 'EAUTH' ||
    /^(Invalid login|BadCredentials|Username and Password not accepted|EAUTH)/.test(message)
  );
}

// GET /api/workspace
exports.getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId);
    if (!workspace) return error(res, 'Workspace not found', 404);
    return success(res, { workspace });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/workspace/create
exports.createWorkspace = async (req, res) => {
  try {
    const rawName = req.body?.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) return error(res, 'Workspace name is required', 400);

    const user = await User.findById(req.user.userId);
    if (!user) return error(res, 'User not found', 404);

    // Check workspace limit for user's current plan (free = 1 workspace)
    const userWorkspaceCount = await Workspace.countDocuments({ ownerId: user._id });
    const WORKSPACE_LIMITS = { free: 1, pro: 3, business: 999 };
    const userLimit = WORKSPACE_LIMITS['free']; // New workspaces start on free plan
    
    if (userWorkspaceCount >= userLimit) {
      return error(
        res,
        `You have reached the maximum workspaces limit (${userLimit}) for the free plan. Please upgrade to create more workspaces.`,
        403
      );
    }

    const workspace = await Workspace.create({
      name,
      description: '',
      setupCompleted: false,
      ownerId: user._id,
    });

    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: 'owner',
    });

    user.workspaceId = workspace._id;
    user.role = 'owner';
    await user.save();

    const { workspaces } = await ensureWorkspaceAccess(user._id, workspace._id);
    const payload = {
      userId: user._id,
      workspaceId: workspace._id,
      role: 'owner',
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return success(res, {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        workspaceId: workspace._id,
        role: 'owner',
        createdAt: user.createdAt,
      },
      workspace,
      workspaces,
      message: 'Workspace created.',
    }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PUT /api/workspace
exports.updateWorkspace = async (req, res) => {
  try {
    const { name, description, setupCompleted } = req.body;
    const patch = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) return error(res, 'Workspace name is required', 400);
      patch.name = trimmedName;
    }

    if (description !== undefined) {
      patch.description = typeof description === 'string' ? description.trim() : '';
    }

    if (setupCompleted !== undefined) {
      patch.setupCompleted = Boolean(setupCompleted);
    }

    const workspace = await Workspace.findByIdAndUpdate(
      req.workspaceId,
      patch,
      { new: true, runValidators: true }
    );
    return success(res, { workspace });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/workspace/invite
exports.inviteUser = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const actorRole = getActiveRole(req);
    const normalizedRole = normalizeManagedRole(role, actorRole);

    console.log('[invite-step-1] Validation:', { email: normalizedEmail, role: normalizedRole, actorRole });

    if (!normalizedEmail) return error(res, 'Email is required');
    if (!normalizedRole) return error(res, 'You cannot invite users with that role', 403);

    console.log('[invite-step-2] Checking existing users...');
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
    if (existingUser) {
      const existingMembership = await WorkspaceMember.findOne({
        userId: existingUser._id,
        workspaceId: req.workspaceId,
      });
      if (existingMembership) return error(res, 'User already in workspace');
    }

    console.log('[invite-step-3] Fetching workspace and inviter...');
    const workspace = await Workspace.findById(req.workspaceId).select('name');
    if (!workspace) return error(res, 'Workspace not found', 404);
    
    const inviter = await User.findById(req.user.userId).select('name email');
    if (!inviter) return error(res, 'Inviter not found', 404);

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    console.log('[invite-step-4] Creating invite token...');
    const token = jwt.sign(
      { email: normalizedEmail, workspaceId: req.workspaceId, role: normalizedRole },
      process.env.INVITE_TOKEN_SECRET,
      { expiresIn: '48h' }
    );

    console.log('[invite-step-5] Saving invite to database...');
    const invite = await WorkspaceInvite.findOneAndUpdate(
      { workspaceId: req.workspaceId, email: normalizedEmail, status: 'pending' },
      {
        workspaceId: req.workspaceId,
        email: normalizedEmail,
        role: normalizedRole,
        invitedBy: req.user.userId,
        token,
        boardName: `${workspace.name} dashboard`,
        expiresAt,
        status: 'pending',
        acceptedAt: null,
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate('invitedBy', 'name email role');

    console.log('[invite-step-6] Queuing email (non-blocking)...');
    // Send email asynchronously without blocking the response
    sendInviteEmail({
      to: normalizedEmail,
      inviterName: inviter.name,
      workspaceName: workspace.name,
      token,
      boardName: `${workspace.name} dashboard`,
    }).catch((emailErr) => {
      console.error('[email-send-failed]', emailErr.message);
    });

    console.log('[invite-step-7] Success!');
    return success(res, { message: `Invite sent to ${normalizedEmail}`, invite });
  } catch (err) {
    console.error('[invite-endpoint-error]', {
      email: req.body?.email,
      workspaceId: req.workspaceId,
      errorMessage: err.message,
      errorCode: err.code,
      errorName: err.constructor.name,
      errorStack: err.stack?.split('\n').slice(0, 3).join(' | '),
    });
    
    if (isEmailTransportError(err)) {
      return error(res, 'Email configuration error: Unable to send invitations. Please contact support.', 502);
    }
    
    // Return the actual error message for debugging
    return error(res, `Failed to send invite: ${err.message}`, 500);
  }
};

// GET /api/workspace/invitations
exports.getInvitations = async (req, res) => {
  try {
    await WorkspaceInvite.updateMany(
      {
        workspaceId: req.workspaceId,
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    const invitations = await WorkspaceInvite.find({ workspaceId: req.workspaceId })
      .populate('invitedBy', 'name email role')
      .sort({ createdAt: -1 });

    return success(res, { invitations });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/workspace/members
exports.getMembers = async (req, res) => {
  try {
    let filter = { workspaceId: req.workspaceId };

    if (!isWorkspaceManager(req)) {
      const accessibleProjectIds = await getAccessibleProjectIds(req);
      const accessibleMemberIds = await Project.distinct('members', {
        workspaceId: req.workspaceId,
        _id: { $in: accessibleProjectIds || [] },
      });

      filter = {
        ...filter,
        userId: { $in: accessibleMemberIds },
      };
    }

    const members = await WorkspaceMember.find(filter)
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: 1 });

    const normalizedMembers = members
      .filter((member) => member.userId)
      .map((member) => ({
        _id: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        createdAt: member.userId.createdAt,
        role: member.role,
      }));
    return success(res, { members: normalizedMembers });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PUT /api/workspace/members/:userId
exports.updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body || {};

    const membership = await WorkspaceMember.findOne({ userId, workspaceId: req.workspaceId }).populate('userId', 'name email createdAt');
    if (!membership || !membership.userId) return error(res, 'Member not found', 404);
    if (membership.role === 'owner') return error(res, 'Cannot change owner role');
    const nextRole = normalizeManagedRole(role, getActiveRole(req));
    if (!nextRole) return error(res, 'Invalid role change', 400);

    membership.role = nextRole;
    await membership.save();

    const activeUser = await User.findById(userId);
    if (activeUser && String(activeUser.workspaceId) === String(req.workspaceId)) {
      activeUser.role = nextRole;
      await activeUser.save();
    }

    return success(res, {
      member: {
        _id: membership.userId._id,
        name: membership.userId.name,
        email: membership.userId.email,
        createdAt: membership.userId.createdAt,
        role: membership.role,
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/workspace/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const membership = await WorkspaceMember.findOne({ userId, workspaceId: req.workspaceId });
    if (!membership) return error(res, 'Member not found', 404);
    if (membership.role === 'owner') return error(res, 'Cannot remove the owner');

    await membership.deleteOne();

    const target = await User.findById(userId);
    if (target && String(target.workspaceId) === String(req.workspaceId)) {
      const nextMembership = await WorkspaceMember.findOne({ userId }).sort({ updatedAt: -1, createdAt: -1 });
      target.workspaceId = nextMembership?.workspaceId || null;
      target.role = nextMembership?.role || 'member';
      await target.save();
    }

    await Project.updateMany(
      { workspaceId: req.workspaceId },
      { $pull: { members: userId } }
    );
    await Task.updateMany(
      { workspaceId: req.workspaceId, assignedTo: userId },
      { $set: { assignedTo: null } }
    );

    return success(res, { message: 'Member removed' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/workspace/list
exports.listUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await getUserWorkspaces(req.user.userId);
    return success(res, { workspaces });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/workspace/switch
exports.switchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) return error(res, 'workspaceId is required');
    if (!mongoose.isValidObjectId(workspaceId)) {
      return error(res, 'Invalid workspaceId', 400);
    }

    const user = await User.findById(req.user.userId);
    if (!user) return error(res, 'Unable to switch workspace', 404);

    const { activeWorkspace, activeRole, workspaces } = await ensureWorkspaceAccess(
      req.user.userId,
      workspaceId
    );
    if (!activeWorkspace || String(activeWorkspace._id) !== String(workspaceId)) {
      return error(res, 'Workspace not found for this user', 404);
    }

    if (
      String(user.workspaceId || '') !== String(activeWorkspace._id) ||
      user.role !== activeRole
    ) {
      user.workspaceId = activeWorkspace._id;
      user.role = activeRole;
      await user.save();
    }

    const payload = {
      userId: user._id,
      workspaceId: activeWorkspace._id,
      role: activeRole,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return success(res, {
      workspace: activeWorkspace,
      role: activeRole,
      workspaces,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/workspace/invitations/:inviteId
exports.cancelInvitation = async (req, res) => {
  try {
    const invite = await WorkspaceInvite.findOne({
      _id: req.params.inviteId,
      workspaceId: req.workspaceId,
    });

    if (!invite) return error(res, 'Invitation not found', 404);

    invite.status = 'cancelled';
    await invite.save();

    return success(res, { invitation: invite });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
