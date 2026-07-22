import { Job } from 'pg-boss';

import {
    BatchWorkerHandler,
    WorkerHandler,
} from '../types';

import {
    BossProvider,
} from './interfaces';

import {
    InternalWorkerRegistration,
    InternalBatchWorkerRegistration,
} from './types';

export class WorkerManager {

    private readonly workers:
        InternalWorkerRegistration[] = [];

    private readonly batchWorkers:
        InternalBatchWorkerRegistration[] = [];


    constructor(
        private readonly bossProvider: BossProvider,
    ) {}


    /**
     * Register simple worker.
     */
    public async startWorker<T>(
        topic: string,
        handler: WorkerHandler<T>,
    ): Promise<void> {

        const registration = {
            topic,
            handler,
        };

        this.workers.push(registration);

        await this.registerWorker(registration);
    }


    /**
     * Register batch worker.
     */
    public async startBatchWorker<T>(
        topic: string,
        batchSize: number,
        handler: BatchWorkerHandler<T>,
    ): Promise<void> {

        const registration = {
            topic,
            batchSize,
            handler,
        };

        this.batchWorkers.push(registration);

        await this.registerBatchWorker(registration);
    }


    /**
     * Restore all workers after reconnect.
     */
    public async restore(): Promise<void> {

        await this.restoreWorkers();

        await this.restoreBatchWorkers();
    }


    /**
     * Restore simple workers.
     */
    private async restoreWorkers(): Promise<void> {

        for (const worker of this.workers) {

            await this.registerWorker(worker);
        }
    }


    /**
     * Restore batch workers.
     */
    private async restoreBatchWorkers(): Promise<void> {

        for (const worker of this.batchWorkers) {

            await this.registerBatchWorker(worker);
        }
    }


    /**
     * Register simple worker inside PgBoss.
     */
    private async registerWorker<T>(
        registration: InternalWorkerRegistration<T>,
    ): Promise<void> {

        const boss = this.bossProvider.getBoss();

        await boss.work(
            registration.topic,
            async (job: Job) => {

                await registration.handler(
                    job.data as T,
                );
            },
        );
    }


    /**
     * Register batch worker inside PgBoss.
     */
    private async registerBatchWorker<T>(
        registration: InternalBatchWorkerRegistration<T>,
    ): Promise<void> {

        const boss = this.bossProvider.getBoss();

        await boss.work(
            registration.topic,
            {
                batchSize: registration.batchSize,
            },
            async (jobs: Job[]) => {

                await registration.handler(
                    jobs.map(
                        job => job.data as T,
                    ),
                );
            },
        );
    }

}
