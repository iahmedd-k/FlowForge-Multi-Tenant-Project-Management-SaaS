const reportService = require('../services/report.service');
const { success, error } = require('../utils/response.util');
const { getAccessibleProjectIds } = require('../services/access.service');

async function getReportProjectScope(req) {
  return getAccessibleProjectIds(req);
}

// GET /api/reports/summary
// returns all 5 metrics in a single response — this is what the dashboard calls
exports.getSummary = async (req, res) => {
  try {
    const projectIds = await getReportProjectScope(req);
    const [
      projectCompletion,
      completedThisWeek,
      overdueCount,
      avgCompletionTime,
      workload,
    ] = await Promise.all([
      reportService.getProjectCompletion(req.workspaceId, projectIds),
      reportService.getCompletedThisWeek(req.workspaceId, projectIds),
      reportService.getOverdueCount(req.workspaceId, projectIds),
      reportService.getAvgCompletionTime(req.workspaceId, projectIds),
      reportService.getWorkloadPerUser(req.workspaceId, projectIds),
    ]);

    return success(res, {
      projectCompletion,   // array — one entry per project
      completedThisWeek,   // number
      overdueCount,        // number
      avgCompletionTime,   // number (hours)
      workload,            // array — one entry per user
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/reports/workload
exports.getWorkload = async (req, res) => {
  try {
    const projectIds = await getReportProjectScope(req);
    const workload = await reportService.getWorkloadPerUser(req.workspaceId, projectIds);
    return success(res, { workload });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/reports/trend
exports.getTrend = async (req, res) => {
  try {
    const projectIds = await getReportProjectScope(req);
    const trend = await reportService.getCompletionTrend(req.workspaceId, projectIds);
    return success(res, { trend });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/reports/overdue
exports.getOverdue = async (req, res) => {
  try {
    const projectIds = await getReportProjectScope(req);
    const tasks = await reportService.getOverdueTasks(req.workspaceId, projectIds);
    return success(res, { tasks, count: tasks.length });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
