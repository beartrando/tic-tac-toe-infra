import PgBoss from 'pg-boss';

import logger from '../../logger';

import {
  PgBossConfig,
} from './types';

import { sleep } from './utils';

import { WorkerManager } from './worker-manager';
import { ProducerManager } from './publisher';
import { KafkaBridge } from './kafka-bridge';

export class PgBossManager {

  private boss: PgBoss | null = null;

  private config!: PgBossConfig;

  private running = false;

  private readonly reconnectDelay = 3000;

  public readonly workers: WorkerManager;

  public readonly producer: ProducerManager;

  public readonly kafka: KafkaBridge;

  constructor() {
    this.workers = new WorkerManager(this);
    this.producer = new ProducerManager(this);
    this.kafka = new KafkaBridge(this);
  }

  public async start(
      config: PgBossConfig,
  ): Promise<void> {

    this.config = config;
    this.running = true;

    while (this.running) {

      try {

        await this.connect();

        while (this.running && this.boss) {
          await sleep(1000);
        }

      } catch (err) {

        logger.error(
            { err },
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

      await sleep(this.reconnectDelay);
    }
  }

  public async stop(): Promise<void> {

    this.running = false;

    await this.cleanup();
  }

  private async connect(): Promise<void> {

    logger.info('Connecting PgBoss...');

    const boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      max: this.config.max ?? 5,
      maintenanceIntervalSeconds:
          this.config.maintenanceIntervalSeconds ?? 60,
      application_name:
      this.config.applicationName,
    });

    await boss.start();

    this.boss = boss;

    logger.info('✅ PgBoss connected');

    await this.workers.restore();

    boss.on('error', async err => {

      logger.error(
          { err },
          'PgBoss error',
      );

      await this.cleanup();
    });
  }

  private async cleanup(): Promise<void> {

    if (!this.boss) {
      return;
    }

    try {
      await this.boss.stop();
    } catch (err) {
      logger.error(
          { err },
          'Failed to stop PgBoss',
      );
    }

    this.boss = null;

    logger.warn('PgBoss disconnected');
  }

  public getBoss(): PgBoss {

    if (!this.boss) {
      throw new Error(
          'PgBoss is not connected',
      );
    }

    return this.boss;
  }
}
