const AUTOMATION_CATALOG = [
  {
    key: 'task_assignment_notification',
    name: 'Task Assignment Notification',
    description: 'If a task is assigned, notify the assignee in-app and by email.',
    isRequired: true,
    defaults: {},
  },
  {
    key: 'status_change_completion',
    name: 'Status Change Automation',
    description: 'If a task moves to Done, stamp its completion time and keep project progress aligned with task status.',
    isRequired: false,
    defaults: {},
  },
  {
    key: 'due_date_reminder',
    name: 'Due Date Reminder',
    description: 'Send a reminder 24 hours before due time and auto-flag overdue tasks.',
    isRequired: false,
    defaults: { reminderHours: 24 },
  },
  {
    key: 'review_stage_alert',
    name: 'Review Stage Alert',
    description: 'When a task moves into Review, notify workspace admins and the project lead.',
    isRequired: false,
    defaults: {},
  },
  {
    key: 'priority_based_alert',
    name: 'Priority-Based Alerts',
    description: 'If a high-priority or urgent task is created, notify workspace admins and the project owner.',
    isRequired: false,
    defaults: {},
  },
  {
    key: 'unassigned_task_alert',
    name: 'Unassigned Task Alert',
    description: 'When a task is created without an owner, notify workspace admins so it gets assigned quickly.',
    isRequired: false,
    defaults: {},
  },
  {
    key: 'project_deadline_warning',
    name: 'Project Deadline Warning',
    description: 'When a project deadline is near, notify all project members.',
    isRequired: false,
    defaults: { projectDeadlineHours: 48 },
  },
  {
    key: 'comment_mention_trigger',
    name: 'Comment Mention Trigger',
    description: 'If someone mentions a teammate in a task comment, notify that user.',
    isRequired: false,
    defaults: {},
  },
];

const AUTOMATION_KEYS = AUTOMATION_CATALOG.map((item) => item.key);
const AUTOMATION_MAP = Object.fromEntries(AUTOMATION_CATALOG.map((item) => [item.key, item]));

function getAutomationDefinition(key) {
  return AUTOMATION_MAP[key] || null;
}

module.exports = {
  AUTOMATION_CATALOG,
  AUTOMATION_KEYS,
  AUTOMATION_MAP,
  getAutomationDefinition,
};
