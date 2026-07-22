import {Job} from 'pg-boss';

import {
    BatchWorkerHandler,
    WorkerHandler,
} from '../types';

import {
    BossProvider,
} from './interfaces';

import {
    InternalBatchWorkerRegistration,
    InternalWorkerRegistration,
} from './types';

import logger from '@shared/logger';

export class WorkerManager {

    private readonly workers: InternalWorkerRegistration[] = [];

    private readonly batchWorkers: InternalBatchWorkerRegistration[] = [];

    constructor(
        private readonly bossProvider: BossProvider,
    ) {}

    /**
     * Register worker.
     *
     * Worker will be attached to PgBoss
     * automatically after every reconnect.
     */
    public async registerWorker<T>(
        topic: string,
        handler: WorkerHandler<T>,
    ): Promise<void> {

        const registration: InternalWorkerRegistration = {
            topic,
            handler: async data => {
                await handler(data as T);
            },
        };

        this.workers.push(registration);

        const boss = this.bossProvider.tryGetBoss();

        if (!boss) {
            logger.info(
                `PgBoss is not connected yet, worker "${topic}" queued for restore`,
            );
            return;
        }

        logger.info(
            `PgBoss already connected, attaching worker "${topic}" immediately`,
        );

        await this.attachWorker(registration);
    }

    /**
     * Register batch worker.
     *
     * Worker will be attached to PgBoss
     * automatically after every reconnect.
     */
    public async registerBatchWorker<T>(
        topic: string,
        batchSize: number,
        handler: BatchWorkerHandler<T>,
    ): Promise<void> {

        const registration: InternalBatchWorkerRegistration = {
            topic,
            batchSize,
            handler: async data => {
                await handler(data as T[]);
            },
        };

        this.batchWorkers.push(registration);

        const boss = this.bossProvider.tryGetBoss();

        if (!boss) {
            logger.info(
                `PgBoss is not connected yet, batch worker "${topic}" queued for restore`,
            );
            return;
        }

        logger.info(
            `PgBoss already connected, attaching batch worker "${topic}" immediately`,
        );

        await this.attachBatchWorker(registration);
    }

    /**
     * Restore all workers after reconnect.
     */
    public async restore(): Promise<void> {

        logger.info('Restore workers...');

        await this.restoreWorkers();

        logger.info('Regular workers restored');

        await this.restoreBatchWorkers();

        logger.info('Batch workers restored');
    }

    /**
     * Restore regular workers.
     */
    private async restoreWorkers(): Promise<void> {

        logger.info(
            `Restoring ${this.workers.length} workers`,
        );

        for (const worker of this.workers) {

            logger.info(
                `Restoring worker ${worker.topic}`,
            );

            await this.attachWorker(
                worker,
            );

            logger.info(
                `Worker attached ${worker.topic}`,
            );
        }
    }

    /**
     * Restore batch workers.
     */
    private async restoreBatchWorkers(): Promise<void> {

        logger.info(
            `Restoring ${this.batchWorkers.length} batch workers`,
        );

        for (const worker of this.batchWorkers) {

            logger.info(
                `Restoring batch worker ${worker.topic}`,
            );

            await this.attachBatchWorker(
                worker,
            );

            logger.info(
                `Batch worker attached ${worker.topic}`,
            );
        }
    }

    /**
     * Ensure queue exists.
     */
    private async ensureQueue(
        topic: string,
    ): Promise<void> {

        const boss = this.bossProvider.getBoss();

        logger.info(
            `Ensure queue ${topic}`,
        );

        try {

            await boss.createQueue(
                topic,
            );

            logger.info(
                `Queue created ${topic}`,
            );

        } catch (err) {

            logger.info(
                { err },
                `Queue already exists ${topic}`,
            );
        }
    }

    /**
     * Attach worker to current PgBoss instance.
     */
    private async attachWorker(
        registration: InternalWorkerRegistration,
    ): Promise<void> {

        logger.info(
            `Attach worker ${registration.topic}`,
        );

        const boss = this.bossProvider.getBoss();

        await this.ensureQueue(
            registration.topic,
        );

        logger.info(
            `Calling boss.work ${registration.topic}`,
        );

        await boss.work(
            registration.topic,
            async (jobs: Job<unknown>[]) => {

                logger.info(
                    `Worker ${registration.topic} received ${jobs.length} jobs`,
                );

                for (const job of jobs) {

                    logger.info(
                        {
                            id: job.id,
                            data: job.data,
                        },
                        `Processing job ${registration.topic}`,
                    );

                    await registration.handler(
                        job.data,
                    );

                    logger.info(
                        {
                            id: job.id,
                        },
                        `Job completed ${registration.topic}`,
                    );
                }
            },
        );

        logger.info(
            `boss.work returned ${registration.topic}`,
        );
    }

    /**
     * Attach batch worker to current PgBoss instance.
     */
    private async attachBatchWorker(
        registration: InternalBatchWorkerRegistration,
    ): Promise<void> {

        logger.info(
            `Attach batch worker ${registration.topic}`,
        );

        const boss = this.bossProvider.getBoss();

        await this.ensureQueue(
            registration.topic,
        );

        logger.info(
            `Calling boss.work(batch) ${registration.topic}`,
        );

        await boss.work(
            registration.topic,
            {
                batchSize: registration.batchSize,
            },
            async (jobs: Job<unknown>[]) => {

                logger.info(
                    `Batch worker ${registration.topic} received ${jobs.length} jobs`,
                );

                await registration.handler(
                    jobs.map(
                        job => job.data,
                    ),
                );

                logger.info(
                    `Batch processed ${registration.topic}`,
                );
            },
        );

        logger.info(
            `boss.work(batch) returned ${registration.topic}`,
        );
    }
}