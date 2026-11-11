import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'invitation' | 'password-reset';
  data: Record<string, unknown>;
}

export const EMAIL_QUEUE_NAME = 'email_queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 30000, // 30s initial backoff
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export const enqueueEmailJob = async (jobData: EmailJobData): Promise<void> => {
  try {
    await emailQueue.add(jobData.template, jobData);
    logger.info({ to: jobData.to, template: jobData.template }, 'Email job enqueued');
  } catch (err) {
    logger.error({ err, to: jobData.to }, 'Failed to enqueue email job');
    throw err;
  }
};
