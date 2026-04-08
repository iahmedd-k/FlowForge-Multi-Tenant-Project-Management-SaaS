const nodemailer = require('nodemailer');

const transporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      jsonTransport: true,
    });

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
    const info = await transporter.sendMail({
      from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
      to,
      subject: `You've been invited to ${workspaceName} on FlowForge`,
      text: `${inviterName} has invited you to join ${workspaceName} on FlowForge.\n\nYou will have access to ${boardName} after you accept the invitation.\n\nAccept invitation: ${link}\n\nThis invitation link expires in 48 hours.`,
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

    if (info?.message) {
      console.log('[invite-email-success]', { to, messageId: info.messageId });
    }

    return info;
  } catch (err) {
    console.error('[invite-email-error]', {
      to,
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
    });
    
    // In production, if SMTP fails, log the invite link instead of throwing
    if (process.env.NODE_ENV === 'production') {
      console.log('[invite-link-fallback]', { to, inviteLink: link, workspaceName, inviterName });
      return { fallback: true, to, link };
    }
    
    throw err;
  }
};

const sendPasswordResetEmail = async ({ to, token }) => {
  const link = buildClientLink('/reset-password', token);
  
  try {
    await transporter.sendMail({
      from:    `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
      to,
      subject: 'Reset your FlowForge password',
      text: `We received a request to reset your FlowForge password.\n\nReset your password: ${link}\n\nThis password reset link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
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
    console.log('[password-reset-email-success]', { to });
  } catch (err) {
    console.error('[password-reset-email-error]', {
      to,
      error: err.message,
      code: err.code,
      responseCode: err.responseCode,
    });
    
    // In production, if SMTP fails, log the reset link instead of throwing
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

  return transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
    to,
    subject: `${priorityEmoji} New assignment: ${taskTitle}`,
    text: `Hi ${recipientName || 'there'},\n\nYou were assigned "${taskTitle}" in ${projectName || 'a project'} (${workspaceName}).\n\nPriority: ${priority}\n${dueDateText ? `${dueDateText}\n` : ''}Open task: ${link}`,
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

  return transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
    to,
    subject: `${statusEmoji} Task status updated: ${taskTitle}`,
    text: `Hi ${recipientName || 'there'},\n\nTask "${taskTitle}" status changed to ${newStatus.replace(/_/g, ' ')}.\n\nProject: ${projectName || 'a project'}\n\nOpen task: ${link}`,
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
};

const sendPriorityAlertEmail = async ({ to, recipientName, taskTitle, projectName, priority, workspaceName = 'your workspace', projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const priorityEmoji = {
    high: '🟠',
    urgent: '🔴',
  }[priority] || '🟠';

  return transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
    to,
    subject: `${priorityEmoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)} priority task: ${taskTitle}`,
    text: `Hi ${recipientName || 'there'},\n\nA ${priority} priority task has been created: "${taskTitle}"\n\nProject: ${projectName || 'a project'}\nWorkspace: ${workspaceName}\n\nOpen task: ${link}`,
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
};

const sendDueDateReminderEmail = async ({ to, recipientName, taskTitle, projectName, workspaceName = 'your workspace', hoursUntilDue, projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const urgency = hoursUntilDue < 6 ? 'very soon' : hoursUntilDue < 12 ? 'soon' : 'in the next 24 hours';

  return transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
    to,
    subject: `⏰ Reminder: "${taskTitle}" is due ${urgency}`,
    text: `Hi ${recipientName || 'there'},\n\nReminder: "${taskTitle}" is due ${urgency}.\n\nProject: ${projectName || 'a project'}\n\nOpen task: ${link}`,
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
};

const sendCommentMentionEmail = async ({ to, recipientName, mentionerName, taskTitle, projectName, workspaceName = 'your workspace', comment, projectPath = '/dashboard' }) => {
  if (!to) return null;

  const link = buildClientUrl(projectPath);
  const commentPreview = comment.substring(0, 150) + (comment.length > 150 ? '...' : '');

  return transporter.sendMail({
    from: `"FlowForge" <${process.env.SMTP_USER || 'no-reply@flowforge.local'}>`,
    to,
    subject: `@${mentionerName} mentioned you in "${taskTitle}"`,
    text: `Hi ${recipientName || 'there'},\n\n${mentionerName} mentioned you in a comment on "${taskTitle}".\n\nComment: ${commentPreview}\n\nProject: ${projectName}\nWorkspace: ${workspaceName}\n\nOpen task: ${link}`,
    html: renderEmailLayout({
      eyebrow: '💬 Comment mention',
      title: `${mentionerName} mentioned you`,
      intro: `<strong>${escapeHtml(mentionerName)}</strong> mentioned you in a comment on task <strong>"${escapeHtml(taskTitle)}"</strong>.`,
      bodyLines: [
        `<strong>Comment preview:</strong><br/><em>"${escapeHtml(commentPreview)}"</em>`,
        `<strong>Project:</strong> ${escapeHtml(projectName || 'Unnamed project')} in ${escapeHtml(workspaceName)}`,
        'Reply directly in the task to continue the conversation.',
      ],
      ctaLabel: 'View comment →',
      ctaHref: link,
      footer: 'You are receiving this because you were mentioned in a comment.',
    }),
  });
};

module.exports = { 
  sendInviteEmail, 
  sendPasswordResetEmail, 
  sendTaskAssignmentEmail,
  sendTaskStatusChangeEmail,
  sendPriorityAlertEmail,
  sendDueDateReminderEmail,
  sendCommentMentionEmail,
  buildClientUrl 
};
