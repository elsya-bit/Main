import { Worker } from 'bullmq';
import { getConnectionOptions, QUEUE_NAMES } from './bullmq';

/**
 * Start the subcontractor escalation worker.
 * This handles the three escalation levels for overdue subcontractor jobs.
 */
export function startSubcontractorEscalationWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.SUBCONTRACTOR_ESCALATION,
    async (job) => {
      const { SubcontractorService } = await import('../../domains/subcontractor/SubcontractorService');
      const service = new SubcontractorService();

      const { jobId, level } = job.data as {
        jobId: string;
        level: 'LEVEL1' | 'LEVEL2' | 'LEVEL3';
      };

      await service.processEscalation(jobId, level);
    },
    {
      connection: getConnectionOptions(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Escalation job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`Escalation job ${job.id} completed (level: ${job.data.level})`);
  });

  return worker;
}
