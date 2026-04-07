const Project      = require('../models/Project');
const Task         = require('../models/Task');
const Notification = require('../models/notifications');
const WorkspaceMember = require('../models/WorkspaceMember');
const { success, error } = require('../utils/response.util');
const {
  buildProjectAccessFilter,
  findAccessibleProject,
} = require('../services/access.service');

// GET /api/projects
// returns all projects in workspace, with completion % calculated
exports.getProjects = async (req, res) => {
  try {
    const filter = await buildProjectAccessFilter(req);
    const projects = await Project.find(filter)
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    // attach completion % to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const total = await Task.countDocuments({ workspaceId: req.workspaceId, projectId: project._id });
        const done  = await Task.countDocuments({ workspaceId: req.workspaceId, projectId: project._id, status: 'done' });
        return {
          ...project.toJSON(),
          completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
          taskCount: total,
        };
      })
    );

    return success(res, { projects: projectsWithStats });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, deadline, memberIds = [] } = req.body;

    // validate members belong to this workspace
    const validMembers = await WorkspaceMember.find({
      userId: { $in: memberIds },
      workspaceId: req.workspaceId,
    }).select('userId');

    const project = await Project.create({
      workspaceId: req.workspaceId,
      name,
      description,
      deadline: deadline || null,
      members: Array.from(new Set([req.user.userId.toString(), ...validMembers.map((m) => m.userId.toString())])),
    });

    await project.populate('members', 'name email role');

    // notify added members
    const notifPromises = validMembers.map((m) =>
      Notification.create({
        workspaceId: req.workspaceId,
        userId:      m.userId,
        type:        'task_assigned',
        message:     `You were added to project "${name}"`,
        link:        `/projects/${project._id}`,
      })
    );
    await Promise.all(notifPromises);

    return success(res, { project }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await findAccessibleProject(req, req.params.id);
    const populatedProject = project
      ? await project.populate('members', 'name email role')
      : null;

    if (!populatedProject) return error(res, 'Project not found', 404);

    const total = await Task.countDocuments({ workspaceId: req.workspaceId, projectId: populatedProject._id });
    const done  = await Task.countDocuments({ workspaceId: req.workspaceId, projectId: populatedProject._id, status: 'done' });

    return success(res, {
      project: {
        ...populatedProject.toJSON(),
        completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
        taskCount: total,
      },
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const { name, description, deadline, status } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.workspaceId },
      { name, description, deadline, status },
      { returnDocument: 'after', runValidators: true }
    ).populate('members', 'name email role');

    if (!project) return error(res, 'Project not found', 404);
    return success(res, { project });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/projects/:id  — owner only
// also deletes all tasks inside the project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });
    if (!project) return error(res, 'Project not found', 404);

    // cascade delete all tasks in this project
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    return success(res, { message: 'Project and all its tasks deleted' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    // confirm user belongs to this workspace
    const membership = await WorkspaceMember.findOne({ userId, workspaceId: req.workspaceId });
    if (!membership) return error(res, 'User not found in workspace', 404);

    const project = await Project.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });
    if (!project) return error(res, 'Project not found', 404);

    // avoid duplicates
    if (project.members.some((memberId) => memberId.toString() === userId.toString()))
      return error(res, 'User already in project');

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email role');

    // notify the added user
    await Notification.create({
      workspaceId: req.workspaceId,
      userId,
      type:    'task_assigned',
      message: `You were added to project "${project.name}"`,
      link:    `/projects/${project._id}`,
    });

    return success(res, { project });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    if (req.params.userId === req.user.userId.toString()) {
      return error(res, 'Use workspace settings to leave a workspace', 400);
    }

    const project = await Project.findOne({
      _id: req.params.id,
      workspaceId: req.workspaceId,
    });
    if (!project) return error(res, 'Project not found', 404);

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await Task.updateMany(
      {
        workspaceId: req.workspaceId,
        projectId: project._id,
        assignedTo: req.params.userId,
      },
      { $set: { assignedTo: null } }
    );
    await project.populate('members', 'name email role');

    return success(res, { project });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
