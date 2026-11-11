export interface PasswordResetEmailData {
  recipientName: string;
  resetLink: string;
  expiresInMinutes: number;
}

export const renderPasswordResetEmail = (
  data: PasswordResetEmailData,
): { html: string; text: string } => {
  const text = `Hello ${data.recipientName},

We received a request to reset your password for your SQL Workspace account.

Reset your password by visiting the link below:
${data.resetLink}

This link is valid for ${data.expiresInMinutes} minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email.
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 32px; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 32px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello <strong>${data.recipientName}</strong>,</p>
    <p>We received a request to reset your password for your SQL Workspace account.</p>
    <p><a href="${data.resetLink}" class="btn" target="_blank">Reset Password</a></p>
    <p style="font-size: 14px; color: #475569;">Or copy and paste this link in your browser:<br><a href="${data.resetLink}">${data.resetLink}</a></p>
    <p><em>This link is valid for ${data.expiresInMinutes} minutes and can only be used once.</em></p>
    <div class="footer">
      <p>If you did not request a password reset, please ignore this email or contact your administrator.</p>
    </div>
  </div>
</body>
</html>`;

  return { html, text };
};

