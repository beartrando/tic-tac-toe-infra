import { Job } from 'pg-boss';

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
    public registerWorker<T>(
        topic: string,
        handler: WorkerHandler<T>,
    ): void {

        this.workers.push({
            topic,
            handler: async data => {
                await handler(data as T);
            },
        });
    }

    /**
     * Register batch worker.
     *
     * Worker will be attached to PgBoss
     * automatically after every reconnect.
     */
    public registerBatchWorker<T>(
        topic: string,
        batchSize: number,
        handler: BatchWorkerHandler<T>,
    ): void {

        this.batchWorkers.push({
            topic,
            batchSize,
            handler: async data => {
                await handler(data as T[]);
            },
        });
    }

    /**
     * Restore all workers after reconnect.
     */
    public async restore(): Promise<void> {

        await this.restoreWorkers();

        await this.restoreBatchWorkers();
    }

    /**
     * Restore regular workers.
     */
    private async restoreWorkers(): Promise<void> {

        for (const worker of this.workers) {

            await this.attachWorker(
                worker,
            );
        }
    }

    /**
     * Restore batch workers.
     */
    private async restoreBatchWorkers(): Promise<void> {

        for (const worker of this.batchWorkers) {

            await this.attachBatchWorker(
                worker,
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

        try {

            await boss.createQueue(
                topic,
            );

        } catch {

            // Queue already exists.
        }
    }

    /**
     * Attach worker to current PgBoss instance.
     */
    private async attachWorker(
        registration: InternalWorkerRegistration,
    ): Promise<void> {

        const boss = this.bossProvider.getBoss();

        await this.ensureQueue(
            registration.topic,
        );

        await boss.work(
            registration.topic,
            async (jobs: Job<unknown>[]) => {

                for (const job of jobs) {

                    await registration.handler(
                        job.data,
                    );
                }
            },
        );
    }

    /**
     * Attach batch worker to current PgBoss instance.
     */
    private async attachBatchWorker(
        registration: InternalBatchWorkerRegistration,
    ): Promise<void> {

        const boss = this.bossProvider.getBoss();

        await this.ensureQueue(
            registration.topic,
        );

        await boss.work(
            registration.topic,
            {
                batchSize: registration.batchSize,
            },
            async (jobs: Job<unknown>[]) => {

                await registration.handler(
                    jobs.map(
                        job => job.data,
                    ),
                );
            },
        );
    }
}