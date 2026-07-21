import logger from '../../logger';
import { createProducer, KafkaConfig } from '../../kafka-manager';
import { Job, PgBoss } from 'pg-boss';
import { PgBossConfig } from './types';

export class PgBossManager {

  private bossInstance: PgBoss | null = null;

  private registrations: Array<() => Promise<void>> = [];

  private config!: PgBossConfig;

  private running = false;

  private reconnectDelay = 3000;

  /**
   * START
   */
  async start(config: PgBossConfig) {
    this.config = config;
    this.running = true;

    while (this.running) {
      try {
        await this.connect();

        while (this.running && this.bossInstance) {
          await this.sleep(1000);
        }

      } catch (e) {
        logger.error('PgBoss crashed', e);
      }

      await this.cleanup();

      if (!this.running) {
        break;
      }

      logger.warn(`Reconnect PgBoss in ${this.reconnectDelay} ms`);

      await this.sleep(this.reconnectDelay);
    }
  }

  /**
   * STOP
   */
  async stop() {
    this.running = false;
    await this.cleanup();
  }

  /**
   * CONNECT
   */
  private async connect() {

    logger.info('Connecting PgBoss...');

    const boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      max: this.config.max ?? 5,
      maintenanceIntervalSeconds:
          this.config.maintenanceIntervalSeconds ?? 60,
      application_name:
          this.config.applicationName ?? 'pgboss',
    });

    await boss.start();

    this.bossInstance = boss;

    logger.info('✅ PgBoss connected');

    await this.restoreWorkers();

    boss.on('error', async (err) => {
      logger.error('PgBoss error', err);

      await this.cleanup();
    });

  }

  /**
   * CLEANUP
   */
  private async cleanup() {

    if (!this.bossInstance) {
      return;
    }

    try {
      await this.bossInstance.stop();
    } catch (e) {
      logger.error(e);
    }

    this.bossInstance = null;

    logger.warn('PgBoss disconnected');
  }

  /**
   * RESTORE
   */
  private async restoreWorkers() {

    logger.info(
        `Restore ${this.registrations.length} workers`
    );

    for (const register of this.registrations) {
      try {
        await register();
      } catch (e) {
        logger.error(e);
      }
    }

  }

  /**
   * CURRENT BOSS
   */
  private getBoss(): PgBoss {

    if (!this.bossInstance) {
      throw new Error('PgBoss not connected');
    }

    return this.bossInstance;
  }

  /**
   * GENERIC WORKER
   */
  async startWorker(
      topic: string,
      handler: (jobs: Job[]) => Promise<void>
  ) {

    const register = async () => {

      const boss = this.getBoss();

      await boss.createQueue(topic);

      await boss.work(topic, handler);

      logger.info(`Worker started: ${topic}`);
    };

    this.registrations.push(register);

    if (this.bossInstance) {
      await register();
    }
  }

  /**
   * KAFKA WORKER
   */
  async startKafkaWorker(
      kafkaConfig: KafkaConfig,
      topic: string
  ) {

    const register = async () => {

      const producer = await createProducer(kafkaConfig);

      const boss = this.getBoss();

      await boss.createQueue(topic);

      await boss.work(
          topic,
          { batchSize: 10 },
          async (jobs: Job[]) => {

            for (const job of jobs) {
              await producer.send(job.name, job.data);
            }

            return true;
          }
      );

      logger.info(`Kafka worker started: ${topic}`);
    };

    this.registrations.push(register);

    if (this.bossInstance) {
      await register();
    }

  }

  /**
   * SEND EVENT
   */
  async enqueueEvent(
      topic: string,
      data: object
  ): Promise<number> {

    const id = await this.getBoss().send(topic, data);

    if (!id) {
      throw new Error(`Failed enqueue ${topic}`);
    }

    return Number(id);
  }

  /**
   * SEND EVENT TX
   */
  async enqueueEventTx(
      topic: string,
      data: object,
      tx: any
  ) {

    return tx.$executeRawUnsafe(
        `
            insert into pgboss.job(name,data)
            values ($1,$2::jsonb)
            returning id
            `,
        topic,
        JSON.stringify(data)
    );
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

const pgBossManager = new PgBossManager();

export default pgBossManager;