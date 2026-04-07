const axios = require('axios');
const Workspace = require('../models/Workspace');

/**
 * Send a Slack notification to the workspace's webhook URL
 * @param {String} workspaceId - The workspace ID
 * @param {Object} messageData - The message data containing:
 *   - title: string (e.g., "New task created")
 *   - message: string (e.g., "Task [title] was created in [project] by [user]")
 *   - actorName: string (the user who triggered the action)
 *   - timestamp: Date (when the action occurred)
 *   - link: string (optional URL to the relevant item)
 */
async function sendSlackNotification(workspaceId, messageData) {
  try {
    const workspace = await Workspace.findById(workspaceId).select('slackWebhookUrl').lean();
    
    if (!workspace?.slackWebhookUrl) {
      // Silently return if no webhook URL is configured
      return;
    }

    const { title, message, actorName, timestamp, link } = messageData;
    
    // Format timestamp for Slack
    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

    // Build Slack message block with formatted layout
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title || 'FlowForge Notification',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*By:* ${actorName || 'System'} | *Time:* ${formattedTime}`,
            },
          ],
        },
        ...(link
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View in FlowForge',
                    },
                    url: link,
                    action_id: 'button_click',
                  },
                ],
              },
            ]
          : []),
      ],
    };

    // Send POST request to Slack webhook
    await axios.post(workspace.slackWebhookUrl, slackMessage, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  } catch (err) {
    // Log error but do not throw - never break the main app flow
    console.error('[slack service error]', {
      workspaceId,
      error: err.message,
      status: err.response?.status,
    });
  }
}

/**
 * Validate that a webhook URL has the correct Slack format
 * @param {String} url - The webhook URL to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
function isValidSlackWebhookUrl(url) {
  if (!url) return false;
  return url.startsWith('https://hooks.slack.com/');
}

module.exports = {
  sendSlackNotification,
  isValidSlackWebhookUrl,
};
