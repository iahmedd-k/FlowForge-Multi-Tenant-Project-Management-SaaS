/**
 * Calendar service for generating ICS files and managing calendar integrations
 * Follows RFC 5545 specification for vCalendar format
 */
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Generate a valid ICS (iCalendar) file from events
 * @param {Array} events - Array of event objects with:
 *   - title: string
 *   - description: string
 *   - startDate: Date (for single-day tasks, this is the due date)
 *   - endDate: Date (optional, for multi-day or project deadlines)
 *   - uid: string (unique identifier)
 *   - url: string (optional, URL to the item)
 * @returns {String} - Valid ICS file content
 */
function generateICS(events = []) {
  if (!Array.isArray(events)) events = [];

  // ICS file header
  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//FlowForge//FlowForge Calendar Export//EN\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += `X-WR-CALNAME:FlowForge Tasks\r\n`;
  ics += `X-WR-TIMEZONE:UTC\r\n`;

  // Add each event
  events.forEach((event) => {
    ics += 'BEGIN:VEVENT\r\n';

    // Unique identifier
    ics += `UID:${event.uid || generateUID()}\r\n`;

    // Event title (summary)
    ics += `SUMMARY:${escapeICSText(event.title || 'Untitled')}\r\n`;

    // Event description
    if (event.description) {
      ics += `DESCRIPTION:${escapeICSText(event.description)}\r\n`;
    }

    // Start date (due date for tasks)
    if (event.startDate) {
      const startDate = new Date(event.startDate);
      ics += `DTSTART:${formatDateForICS(startDate)}\r\n`;
    }

    // End date (optional, for multi-day events)
    if (event.endDate) {
      const endDate = new Date(event.endDate);
      ics += `DTEND:${formatDateForICS(endDate)}\r\n`;
    }

    // Created timestamp
    ics += `DTSTAMP:${formatDateForICS(new Date())}\r\n`;

    // URL to the item
    if (event.url) {
      ics += `URL:${event.url}\r\n`;
    }

    // Default alert (optional)
    ics += 'BEGIN:VALARM\r\n';
    ics += 'ACTION:DISPLAY\r\n';
    ics += 'DESCRIPTION:Task due\r\n';
    ics += 'TRIGGER:-PT1H\r\n'; // 1 hour before
    ics += 'END:VALARM\r\n';

    ics += 'END:VEVENT\r\n';
  });

  // ICS file footer
  ics += 'END:VCALENDAR\r\n';

  return ics;
}

/**
 * Format a date for ICS file (UTC format: YYYYMMDDTHHMMSSZ)
 * @param {Date} date - The date to format
 * @returns {String} - Formatted date string
 */
function formatDateForICS(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in ICS text fields
 * @param {String} text - The text to escape
 * @returns {String} - Escaped text
 */
function escapeICSText(text = '') {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .trim();
}

/**
 * Generate a unique identifier for an event
 * @returns {String} - Unique ID
 */
function generateUID() {
  return `flowforge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@flowforge.io`;
}

/**
 * Get user's assigned tasks as ICS events
 * @param {String} userId - The user ID
 * @returns {Array} - Array of ICS event objects
 */
async function getUserTaskEvents(userId) {
  const tasks = await Task.find({
    assignedTo: userId,
    status: { $ne: 'done' },
    dueDate: { $exists: true, $ne: null },
  })
    .populate('assignedTo', 'name')
    .populate('projectId', 'name')
    .lean();

  return tasks.map((task) => ({
    title: task.title,
    description: `${task.description || ''} | Project: ${task.projectId?.name || 'Unknown'}`.trim(),
    startDate: task.dueDate,
    uid: `task-${task._id}@flowforge.io`,
    url: `/projects/${task.projectId}`,
  }));
}

/**
 * Get a single task as an ICS event
 * @param {String} taskId - The task ID
 * @returns {Array} - Array with single task event
 */
async function getTaskEvent(taskId) {
  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name')
    .populate('projectId', 'name')
    .lean();

  if (!task) return [];

  return [
    {
      title: task.title,
      description: `${task.description || ''} | Project: ${task.projectId?.name || 'Unknown'}`.trim(),
      startDate: task.dueDate,
      uid: `task-${task._id}@flowforge.io`,
      url: `/projects/${task.projectId}`,
    },
  ];
}

/**
 * Get a project deadline as an ICS event
 * @param {String} projectId - The project ID
 * @returns {Array} - Array with single project event
 */
async function getProjectEvent(projectId) {
  const project = await Project.findById(projectId).lean();

  if (!project) return [];

  // Only include if there's a deadline
  if (!project.deadline) return [];

  return [
    {
      title: `Project Deadline: ${project.name}`,
      description: project.description || '',
      startDate: project.deadline,
      uid: `project-${project._id}@flowforge.io`,
      url: `/projects/${project._id}`,
    },
  ];
}

module.exports = {
  generateICS,
  formatDateForICS,
  escapeICSText,
  generateUID,
  getUserTaskEvents,
  getTaskEvent,
  getProjectEvent,
};
