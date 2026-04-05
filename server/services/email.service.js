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

function buildClientLink(pathname, token) {
  const rawBase = process.env.CLIENT_URL || 'http://localhost:5173';
  let baseUrl;

  try {
    const parsed = new URL(rawBase);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    baseUrl = rawBase.replace(/\/+$/, '');
  }

  return `${baseUrl}${pathname}?token=${encodeURIComponent(token)}`;
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
    console.log('[invite-email-preview]', info.message.toString());
  }

  return info;
};

const sendPasswordResetEmail = async ({ to, token }) => {
  const link = buildClientLink('/reset-password', token);
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
};

module.exports = { sendInviteEmail, sendPasswordResetEmail };
