export interface InvitationEmailData {
  recipientName: string;
  inviterName: string;
  roleOrDesignation: string;
  inviteLink: string;
  expiresInHours: number;
}

export const renderInvitationEmail = (
  data: InvitationEmailData,
): { html: string; text: string } => {
  const text = `Hello ${data.recipientName},

You have been invited by ${data.inviterName} to join SQL Workspace as ${data.roleOrDesignation}.

Please set up your account by clicking the following link:
${data.inviteLink}

This invitation link will expire in ${data.expiresInHours} hours.

If you were not expecting this invitation, you can ignore this email.
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 32px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 32px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to SQL Workspace</h2>
    <p>Hello <strong>${data.recipientName}</strong>,</p>
    <p><strong>${data.inviterName}</strong> has invited you to join SQL Workspace as <strong>${data.roleOrDesignation}</strong>.</p>
    <p>Click the button below to accept your invitation and set up your password:</p>
    <p><a href="${data.inviteLink}" class="btn" target="_blank">Accept Invitation</a></p>
    <p style="font-size: 14px; color: #475569;">Or copy and paste this link in your browser:<br><a href="${data.inviteLink}">${data.inviteLink}</a></p>
    <p><em>This link is valid for ${data.expiresInHours} hours.</em></p>
    <div class="footer">
      <p>If you were not expecting this invitation, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  return { html, text };
};

