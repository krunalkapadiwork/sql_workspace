import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobData } from './queues';
import {
  renderInvitationEmail,
  InvitationEmailData,
} from './templates/invitation.template';
import {
  renderPasswordResetEmail,
  PasswordResetEmailData,
} from './templates/password-reset.template';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    }
    : undefined,
});

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    logger.info({ jobId: job.id, to: job.data.to }, 'Processing email job');

    let html = '';
    let text = '';

    if (job.data.template === 'invitation') {
      const rendered = renderInvitationEmail(job.data.data as unknown as InvitationEmailData);
      html = rendered.html;
      text = rendered.text;
    } else if (job.data.template === 'password-reset') {
      const rendered = renderPasswordResetEmail(
        job.data.data as unknown as PasswordResetEmailData,
      );
      html = rendered.html;
      text = rendered.text;
    }

      const info = await transporter.sendMail({
        from: env.MAIL_FROM,
        to: job.data.to,
        subject: job.data.subject,
        text,
        html,
      });

      logger.info(
        {
          jobId: job.id,
          to: job.data.to,
          messageId: info.messageId,
          smtpResponse: info.response,
          accepted: info.accepted,
        },
        'Email delivered successfully',
      );
    },
      {
        connection: redis,
        concurrency: 5,
      },
    );

    emailWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Email job failed');
    });

    emailWorker.on('error', (err) => {
      logger.error({ err }, 'Email worker error');
    });
