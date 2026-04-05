const Project = require('../models/Project');

function getActiveRole(req) {
  return req.workspaceRole || req.user?.role || 'viewer';
}

function isOwner(req) {
  return getActiveRole(req) === 'owner';
}

function isWorkspaceManager(req) {
  return ['owner', 'admin'].includes(getActiveRole(req));
}

function canCreateTask(req) {
  return ['owner', 'admin', 'member'].includes(getActiveRole(req));
}

function canCommentOnTask(req) {
  return ['owner', 'admin', 'member', 'viewer'].includes(getActiveRole(req));
}

async function getAccessibleProjectIds(req) {
  if (isWorkspaceManager(req)) return null;

  const projects = await Project.find({
    workspaceId: req.workspaceId,
    members: req.user.userId,
  }).select('_id');

  return projects.map((project) => project._id);
}

async function buildProjectAccessFilter(req, extraFilter = {}) {
  const filter = { workspaceId: req.workspaceId, ...extraFilter };
  if (isWorkspaceManager(req)) return filter;
  return { ...filter, members: req.user.userId };
}

async function buildTaskAccessFilter(req, extraFilter = {}) {
  const filter = { workspaceId: req.workspaceId, ...extraFilter };
  const projectIds = await getAccessibleProjectIds(req);

  if (projectIds === null) return filter;
  return { ...filter, projectId: { $in: projectIds } };
}

async function findAccessibleProject(req, projectId) {
  const filter = await buildProjectAccessFilter(req, { _id: projectId });
  return Project.findOne(filter);
}

module.exports = {
  getActiveRole,
  isOwner,
  isWorkspaceManager,
  canCreateTask,
  canCommentOnTask,
  getAccessibleProjectIds,
  buildProjectAccessFilter,
  buildTaskAccessFilter,
  findAccessibleProject,
};
