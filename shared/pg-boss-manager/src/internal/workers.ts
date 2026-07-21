import { Job } from 'pg-boss';

import logger from '../../logger';

import { PgBossManager } from './manager';

import {
  WorkerHandler,
  BatchWorkerHandler,
  InternalWorkerRegistration,
} from './types';

export class WorkerManager {

  private readonly workers: InternalWorkerRegistration[] = [];

  constructor(
      private readonly manager: PgBossManager,
  ) {
  }

  /**
   * Restore all registered workers.
   */
  public async restore(): Promise<void> {

    logger.info(
        `Restore ${this.workers.length} workers`,
    );

    for (const worker of this.workers) {
      try {
        await worker.register();
      } catch (err) {
        logger.error(
            {
              topic: worker.topic,
              err,
            },
            'Failed to restore worker',
        );
      }
    }
  }

  /**
   * Register worker (single message).
   */
  public async startWorker<T>(
      topic: string,
      handler: WorkerHandler<T>,
  ): Promise<void> {

    const register = async () => {

      const boss = this.manager.getBoss();

      await boss.createQueue(topic);

      await boss.work(
          topic,
          async (jobs: Job[]) => {

            for (const job of jobs) {
              await handler(job.data as T);
            }

            return true;
          },
      );

      logger.info(
          `Worker started: ${topic}`,
      );
    };

    this.workers.push({
      topic,
      register,
    });

    try {
      this.manager.getBoss();

      await register();

    } catch {
      // PgBoss isn't connected yet.
      // Worker will be restored after connect().
    }
  }

  /**
   * Register batch worker.
   */
  public async startBatchWorker<T>(
      topic: string,
      handler: BatchWorkerHandler<T>,
      batchSize = 10,
  ): Promise<void> {

    const register = async () => {

      const boss = this.manager.getBoss();

      await boss.createQueue(topic);

      await boss.work(
          topic,
          {
            batchSize,
          },
          async (jobs: Job[]) => {

            await handler(
                jobs.map(
                    job => job.data as T,
                ),
            );

            return true;
          },
      );

      logger.info(
          `Batch worker started: ${topic}`,
      );
    };

    this.workers.push({
      topic,
      register,
    });

    try {
      this.manager.getBoss();

      await register();

    } catch {
      // PgBoss isn't connected yet.
      // Worker will be restored after connect().
    }
  }
}
