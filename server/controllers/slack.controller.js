const Workspace = require('../models/Workspace');
const { success, error } = require('../utils/response.util');
const {
  sendSlackNotification,
  isValidSlackWebhookUrl,
} = require('../services/slack.service');

/**
 * POST /api/integrations/slack/save
 * Save a Slack webhook URL to the workspace
 */
exports.saveWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    // Validate input
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return error(res, 'Webhook URL is required', 400);
    }

    // Validate webhook URL format
    if (!isValidSlackWebhookUrl(webhookUrl)) {
      return error(res, 'Invalid Slack webhook URL', 400);
    }

    // Update workspace with the webhook URL
    const workspace = await Workspace.findByIdAndUpdate(
      req.workspaceId,
      { slackWebhookUrl: webhookUrl },
      { new: true }
    ).select('name slackWebhookUrl');

    if (!workspace) {
      return error(res, 'Workspace not found', 404);
    }

    return success(res, { workspace });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * DELETE /api/integrations/slack/remove
 * Remove the Slack webhook URL from the workspace
 */
exports.removeWebhook = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.workspaceId,
      { slackWebhookUrl: null },
      { new: true }
    ).select('name slackWebhookUrl');

    if (!workspace) {
      return error(res, 'Workspace not found', 404);
    }

    return success(res, { workspace });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/integrations/slack/test
 * Send a test message to the Slack webhook to verify it works
 */
exports.testWebhook = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId).select(
      'name slackWebhookUrl'
    );

    if (!workspace) {
      return error(res, 'Workspace not found', 404);
    }

    if (!workspace.slackWebhookUrl) {
      return error(res, 'No Slack webhook URL configured', 400);
    }

    // Send test notification
    await sendSlackNotification(req.workspaceId, {
      title: '✅ Test Notification',
      message: 'This is a test message from FlowForge. Your Slack integration is working!',
      actorName: req.user?.name || 'Test User',
      timestamp: new Date(),
      link: null,
    });

    return success(res, {
      message: 'Test notification sent successfully',
    });
  } catch (err) {
    console.error('[slack test error]', err.message);
    return error(
      res,
      'Slack delivery failed. Please check your webhook URL.',
      400
    );
  }
};

/**
 * GET /api/integrations/slack/status
 * Get the current Slack integration status (webhook URL exists)
 */
exports.getStatus = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.workspaceId).select(
      'slackWebhookUrl'
    );

    if (!workspace) {
      return error(res, 'Workspace not found', 404);
    }

    const isConnected = !!workspace.slackWebhookUrl;
    // Mask the URL showing only the last 10 characters
    const maskedUrl = isConnected
      ? `${'*'.repeat(workspace.slackWebhookUrl.length - 10)}${workspace.slackWebhookUrl.slice(-10)}`
      : null;

    return success(res, {
      isConnected,
      maskedUrl,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
