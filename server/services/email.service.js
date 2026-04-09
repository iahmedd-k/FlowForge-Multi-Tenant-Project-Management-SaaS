const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('[WARNING] RESEND_API_KEY not found in environment variables');
}

const resend = new Resend(apiKey);

function buildClientUrl(pathname = '') {
  const rawBase = process.env.CLIENT_URL || 'http://localhost:5173';
  let baseUrl;

  try {
    const parsed = new URL(rawBase);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    baseUrl = rawBase.replace(/\/+$/, '');
  }

  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

function buildClientLink(pathname, token) {
  return `${buildClientUrl(pathname)}?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailLayout({ eyebrow, title, intro, bodyLines = [], ctaLabel, ctaHref, footer }) {
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooter = escapeHtml(footer);
  const body = bodyLines
    .map((line) => `<p style="margin:0 0 14px;color:#475467;font-size:15px;line-height:1.7;">${line}</p>`)
    .join('');

  return `
    <div style="margin:0;padding:32px 16px;background:#f4f7fb;font-family:Arial,sans-serif;color:#101828;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e7ec;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(16,24,40,0.08);">
        <div style="padding:28px 32px 12px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#667085;">${safeEyebrow}</div>
          <h1 style="margin:12px 0 12px;font-size:28px;line-height:1.2;color:#101828;">${safeTitle}</h1>
          <p style="margin:0 0 18px;color:#344054;font-size:15px;line-height:1.7;">${safeIntro}</p>
          ${body}
          <div style="margin:26px 0 18px;">
            <a href="${ctaHref}" style="display:inline-block;padding:12px 22px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">
              ${escapeHtml(ctaLabel)}
            </a>
          </div>
          <p style="margin:0;color:#667085;font-size:12px;line-height:1.6;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="margin:8px 0 0;word-break:break-all;color:#1d4ed8;font-size:12px;line-height:1.6;">${escapeHtml(ctaHref)}</p>
        </div>
        <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eaecf0;color:#667085;font-size:12px;line-height:1.6;">
          ${safeFooter}
        </div>
      </div>
    </div>
  `;
}

const sendInviteEmail = async ({ to, inviterName, workspaceName, token, boardName = 'Dashboard' }) => {
  const link = buildClientLink('/invite/setup', token);
  
  try {
    console.log('[resend-send] Attempting to send invite email via Resend', { to, workspaceName });
    
    const result = await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `You've been invited to ${workspaceName} on FlowForge`,
      html: renderEmailLayout({
        eyebrow: 'Workspace invitation',
        title: `Join ${workspaceName} on FlowForge`,
        intro: `${inviterName} has invited you to collaborate in ${workspaceName}.`,
        bodyLines: [
          `Once accepted, you will be able to access ${escapeHtml(boardName)} and the workspace resources shared with your role.`,
          'If you were not expecting this invitation, you can safely ignore this email.',
        ],
        ctaLabel: 'Accept invitation',
        ctaHref: link,
        footer: 'This invitation link expires in 48 hours.',
      }),
    });

    console.log('[resend-response]', { to, result });

    if (result?.id) {
      console.log('[invite-email-success]', { to, messageId: result.id });
      return result;
    }
    
    if (result?.error) {
      console.error('[resend-error]', { to, error: result.error });
      throw new Error(result.error?.message || 'Resend API error');
    }

    return result;
  } catch (err) {
    const errorMessage = err.message || '';
    const isResendTestingError = errorMessage.includes('testing emails') || 
                                 errorMessage.includes('verify a domain');
    
    console.error('[invite-email-error]', {
      to,
      error: errorMessage,
      code: err.code,
      isTestingModeError: isResendTestingError,
      fullError: err,
    });
    
    // For Resend testing mode errors or any email errors, provide fallback with invite link
    // This allows invites to work even without email service configured
    if (isResendTestingError || process.env.NODE_ENV === 'production' || process.env.ALLOW_EMAIL_FALLBACK === 'true') {
      console.log('[invite-link-fallback]', { 
        to, 
        inviteLink: link, 
        workspaceName, 
        inviterName,
        reason: isResendTestingError ? 'Resend free tier limitation' : 'Email service error'
      });
      return { fallback: true, to, link, inviterName, workspaceName };
    }
    
    throw err;
  }
};

const sendPasswordResetEmail = async ({ to, token }) => {
  const link = buildClientLink('/reset-password', token);
  
  try {
    console.log('[resend-send] Attempting to send password reset email via Resend', { to });
    
    const result = await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: 'Reset your FlowForge password',
      html: renderEmailLayout({
        eyebrow: 'Account security',
        title: 'Reset your password',
        intro: 'We received a request to reset your FlowForge password.',
        bodyLines: [
          'Use the secure link below to choose a new password for your account.',
          'If you did not request a password reset, no further action is required.',
        ],
        ctaLabel: 'Reset password',
        ctaHref: link,
        footer: 'This password reset link expires in 1 hour.',
      }),
    });

    console.log('[resend-response]', { to, result });
    
    if (result?.error) {
      console.error('[resend-error]', { to, error: result.error });
      throw new Error(result.error?.message || 'Resend API error');
    }
    
    console.log('[password-reset-email-success]', { to });
    return result;
  } catch (err) {
    console.error('[password-reset-email-error]', {
      to,
      error: err.message,
      code: err.code,
    });
    
    // In production, log the reset link as fallback
    if (process.env.NODE_ENV === 'production') {
      console.log('[password-reset-link-fallback]', { to, resetLink: link });
      return { fallback: true, to, link };
    }
    
    throw err;
  }
};

const sendTaskAssignmentEmail = async ({ to, recipientName, taskTitle, projectName, workspaceName = 'your workspace', priority = 'medium', dueDate = null, projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  }[priority] || '🟡';

  const dueDateText = dueDate 
    ? `Due: ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null;

  try {
    return await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `${priorityEmoji} New assignment: ${taskTitle}`,
      html: renderEmailLayout({
        eyebrow: `${priorityEmoji} Task assignment`,
        title: `You were assigned "${taskTitle}"`,
        intro: `${recipientName || 'Hi there'}, you've been assigned a task in <strong>${escapeHtml(projectName || 'a project')}</strong>.`,
        bodyLines: [
          `<strong>Priority:</strong> ${priorityEmoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)}`,
          ...(dueDateText ? [`<strong>Due Date:</strong> ${dueDateText}`] : []),
          `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
          'Click the button below to open the task and review all details, comments, and attachments.',
        ],
        ctaLabel: 'View task →',
        ctaHref: link,
        footer: 'You are receiving this because task assignment notifications are enabled for your account.',
      }),
    });
  } catch (err) {
    console.error('[task-assignment-email-error]', { to, error: err.message });
  }
};

const sendTaskStatusChangeEmail = async ({ to, recipientName, taskTitle, projectName, newStatus, workspaceName = 'your workspace', projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const statusEmoji = {
    backlog: '📋',
    in_progress: '🔄',
    review: '👀',
    done: '✅',
  }[newStatus] || '📋';

  try {
    return await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `${statusEmoji} Task status updated: ${taskTitle}`,
      html: renderEmailLayout({
        eyebrow: `${statusEmoji} Status update`,
        title: `Task "${taskTitle}" moved to ${newStatus.replace(/_/g, ' ')}`,
        intro: `A task you're involved with has been updated in <strong>${escapeHtml(projectName || 'a project')}</strong>.`,
        bodyLines: [
          `<strong>New Status:</strong> ${statusEmoji} ${newStatus.replace(/_/g, ' ').charAt(0).toUpperCase() + newStatus.replace(/_/g, ' ').slice(1)}`,
          `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
          'Check the task for any new comments or attachments.',
        ],
        ctaLabel: 'View task →',
        ctaHref: link,
        footer: 'You are receiving this because you are participating in this task or project.',
      }),
    });
  } catch (err) {
    console.error('[task-status-change-email-error]', { to, error: err.message });
  }
};

const sendPriorityAlertEmail = async ({ to, recipientName, taskTitle, projectName, priority, workspaceName = 'your workspace', projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const priorityEmoji = {
    high: '🟠',
    urgent: '🔴',
  }[priority] || '🟠';

  try {
    return await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `${priorityEmoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)} priority task: ${taskTitle}`,
      html: renderEmailLayout({
        eyebrow: `${priorityEmoji} Priority alert`,
        title: `${priority.toUpperCase()} priority task created`,
        intro: `A ${priority} priority task has been created in <strong>${escapeHtml(projectName || 'a project')}</strong> that requires immediate attention.`,
        bodyLines: [
          `<strong>Task:</strong> "${escapeHtml(taskTitle)}"`,
          `<strong>Priority:</strong> ${priorityEmoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)}`,
          `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
          'Please review and take action as needed.',
        ],
        ctaLabel: 'Review task →',
        ctaHref: link,
        footer: 'You are receiving this because you are an admin or project lead in this workspace.',
      }),
    });
  } catch (err) {
    console.error('[priority-alert-email-error]', { to, error: err.message });
  }
};

const sendDueDateReminderEmail = async ({ to, recipientName, taskTitle, projectName, workspaceName = 'your workspace', hoursUntilDue, projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const urgency = hoursUntilDue < 6 ? 'very soon' : hoursUntilDue < 12 ? 'soon' : 'in the next 24 hours';

  try {
    return await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `⏰ Reminder: "${taskTitle}" is due ${urgency}`,
      html: renderEmailLayout({
        eyebrow: '⏰ Due date reminder',
        title: `"${taskTitle}" is due ${urgency}`,
        intro: `A task you're assigned to is coming up soon in <strong>${escapeHtml(projectName || 'a project')}</strong>.`,
        bodyLines: [
          `<strong>Task:</strong> "${escapeHtml(taskTitle)}"`,
          `<strong>Due in:</strong> Approximately ${hoursUntilDue} hours`,
          `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
          'Make sure to complete or update the task status before the deadline.',
        ],
        ctaLabel: 'Update task →',
        ctaHref: link,
        footer: 'You are receiving this reminder because you are assigned to this task.',
      }),
    });
  } catch (err) {
    console.error('[due-date-reminder-email-error]', { to, error: err.message });
  }
};

const sendCommentMentionEmail = async ({ to, recipientName, mentionerName, taskTitle, projectName, workspaceName = 'your workspace', comment, projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const commentPreview = comment.substring(0, 150) + (comment.length > 150 ? '...' : '');

  try {
    return await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
      to,
      subject: `💬 ${mentionerName} mentioned you in "${taskTitle}"`,
      html: renderEmailLayout({
        eyebrow: '💬 New mention',
        title: `You were mentioned by ${mentionerName}`,
        intro: `${mentionerName} mentioned you in a comment on <strong>"${escapeHtml(taskTitle)}"</strong>.`,
        bodyLines: [
          `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
          `<strong>Comment preview:</strong> "${escapeHtml(commentPreview)}"`,
          'Click below to view the full comment and task details.',
        ],
        ctaLabel: 'View comment →',
        ctaHref: link,
        footer: 'You are receiving this because you were mentioned in a comment.',
      }),
    });
  } catch (err) {
    console.error('[comment-mention-email-error]', { to, error: err.message });
  }
};

module.exports = { 
  sendInviteEmail, 
  sendPasswordResetEmail, 
  sendTaskAssignmentEmail,
  sendTaskStatusChangeEmail,
  sendPriorityAlertEmail,
  sendDueDateReminderEmail,
  sendCommentMentionEmail,
  buildClientUrl,
  buildClientLink
};
