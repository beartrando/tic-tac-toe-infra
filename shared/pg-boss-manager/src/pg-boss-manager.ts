import {PgBoss} from 'pg-boss';

import logger from '@shared/logger';

import {PgBossConfig} from './types';

import {sleep} from './internal/utils';

import {WorkerManager} from './internal/worker-manager';
import {QueueManager} from './internal/queue-manager';
import {KafkaBridge} from './internal/kafka-bridge';
import {BossProvider} from './internal/interfaces';

export class PgBossManager implements BossProvider {

    private boss: PgBoss | null = null;

    private config?: PgBossConfig;

    private running = false;

    private readonly reconnectDelay = 3000;

    public readonly workers: WorkerManager;

    public readonly queue: QueueManager;

    public readonly kafka: KafkaBridge;

    private readyPromise!: Promise<void>;

    private readyResolver!: () => void;

    private readyResolved = false;

    constructor() {

        this.createReadyPromise();

        this.workers = new WorkerManager(this);

        this.queue = new QueueManager(this);

        this.kafka = new KafkaBridge(
            this.workers,
        );
    }

    private createReadyPromise(): void {

        this.readyPromise = new Promise<void>(
            resolve => {
                this.readyResolver = resolve;
            },
        );
    }

    public tryGetBoss(): PgBoss | null {

        return this.boss;
    }

    public async waitUntilReady(): Promise<PgBoss> {

        await this.readyPromise;

        return this.getBoss();
    }

    /**
     * Start PgBoss lifecycle.
     */
    public async start(
        config: PgBossConfig,
    ): Promise<void> {

        if (this.running) {
            throw new Error(
                'PgBoss already started',
            );
        }

        this.config = config;
        this.running = true;

        while (this.running) {

            try {

                await this.connect();

                while (
                    this.running &&
                    this.boss
                    ) {
                    await sleep(1000);
                }

            } catch (err) {

                logger.error(
                    {err},
                    'PgBoss crashed',
                );
            }

            await this.cleanup();

            if (!this.running) {
                break;
            }

            logger.warn(
                `Reconnect PgBoss in ${this.reconnectDelay} ms`,
            );

            await sleep(
                this.reconnectDelay,
            );
        }
    }

    /**
     * Stop PgBoss lifecycle.
     */
    public async stop(): Promise<void> {

        this.running = false;

        await this.cleanup();
    }

    /**
     * Create PgBoss connection.
     */
    private async connect(): Promise<void> {

        if (!this.config) {
            throw new Error(
                'PgBoss app is missing',
            );
        }

        logger.info(
            'Connecting PgBoss...',
        );

        const boss = new PgBoss({

            connectionString:
            process.env.DATABASE_URL,

            max:
                this.config.max ?? 5,

            maintenanceIntervalSeconds:
                this.config.maintenanceIntervalSeconds ?? 60,

            application_name:
            this.config.applicationName,
        });

        boss.on(
            'error',
            async err => {

                logger.error(
                    {err},
                    'PgBoss error',
                );

                await this.cleanup();
            },
        );

        await boss.start();

        this.boss = boss;

        logger.info(
            '✅ PgBoss connected',
        );

        await this.workers.restore();

        logger.info(
            '✅ PgBoss workers restored',
        );

        if (!this.readyResolved) {

            this.readyResolved = true;

            this.readyResolver();
        }
    }

    /**
     * Close PgBoss connection.
     */
    private async cleanup(): Promise<void> {

        const boss = this.boss;

        if (!boss) {
            return;
        }

        this.boss = null;

        try {

            await boss.stop();

        } catch (err) {

            logger.error(
                {err},
                'Failed to stop PgBoss',
            );
        }

        logger.warn(
            'PgBoss disconnected',
        );
    }

    /**
     * Get active PgBoss instance.
     */
    public getBoss(): PgBoss {

        if (!this.boss) {

            throw new Error(
                'PgBoss is not connected',
            );
        }

        return this.boss;
    }

    async check(): Promise<boolean> {
        return this.tryGetBoss() !== null;
    }
}
