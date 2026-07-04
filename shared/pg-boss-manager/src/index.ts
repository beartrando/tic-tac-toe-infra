import logger from '../../logger';
import {createProducer, KafkaConfig} from '../../kafka-manager';
import {Job, PgBoss} from 'pg-boss';
import {PgBossConfig} from './types';


export class PgBossManager {

  private _boss: PgBoss | null = null;

  private workers: Array<() => Promise<void>> = [];

  // constructor() {
  //   logger.log(__filename);
  //
  //   // Таймер проверки состояния PgBoss
  //   setInterval(() => {
  //     if (this._boss) {
  //       console.log("✅ PgBoss instance exists");
  //     } else {
  //       console.log("❌ PgBoss is null");
  //     }
  //   }, 1000);
  // }

  setBoss(boss: PgBoss) {
    logger.log('setPgboss');
    this._boss = boss;
  }

  initBoss = (
    config: PgBossConfig,
    cb: () => void
  ): Promise<PgBoss> => {

    return (async () => {
      const boss = new PgBoss({
        connectionString: process.env.DATABASE_URL,
        max: config.max ?? 5,
        maintenanceIntervalSeconds: config.maintenanceIntervalSeconds ?? 60,
        application_name: config.applicationName ?? 'pgboss',
      });

      await boss.start();

      this.setBoss(boss);

      logger.info('✅ PgBoss connected');

      cb();

      return boss;
    })();

  };

  boss = async (): Promise<PgBoss> => {
    if (!this._boss) {
      throw new Error('PgBoss not initialized');
    }
    return this._boss;
  };


  stopBoss = async () => {
    logger.info('Stop Boss !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    if (!this._boss) return;

    try {
      await this._boss.stop();
      logger.info('🛑 PgBoss stopped');
    } catch (e) {
      logger.error('PgBoss stop error', e);
    } finally {
      this._boss = null;
      // workersStarted = false;
    }
  }

  /**
   * GENERIC WORKER
   */
  startWorker = async (
    topic: string,
    handler: (jobs: Job[]) => Promise<void>
  ) => {
    const register = async () => {
      const boss = await this.boss();

      await boss.createQueue(topic);

      await boss.work(topic, handler);

      logger.info(`📦 Worker started: ${topic}`);
    };

    this.workers.push(register);

    if (this._boss) {
      await register();
    }
  }

  /**
   * KAFKA WORKER (batch-safe)
   */
  startKafkaWorker = async (
    kafkaConfig: KafkaConfig,
    topic: string
  ) => {
    const register = async () => {
      const producer = await createProducer(kafkaConfig);
      const b = await this.boss();

      await b.createQueue(topic);

      await b.work(
        topic,
        {batchSize: 10},
        async (jobs: Job<unknown>[]) => {
          for (const j of jobs) {
            await producer.send(j.name, j.data);
          }
          return true;
        }
      );

      logger.info(`Kafka worker started: ${topic}`);
    };

    this.workers.push(register);

    if (this._boss) {
      await register();
    }
  }

  enqueueEvent = async (topic: string, data: object): Promise<number | null> => {
    const jobName = topic;
    // logger.log('here ' + jobName);
    // logger.log(boss.toString());
    const bossObj = await pgBossManager.boss();
    // logger.log(bossObj);
    const jobId = await bossObj.send(jobName, data);

    if (!jobId) {
      throw new Error(`Failed to enqueue event: topic`);
    }

    return Number(jobId);

  }

  enqueueEventTx = async (
    topic: string,
    data: object,
    tx: any
  ): Promise<number | null> => {
    const jobName = topic;
    // logger.log('enqueueEventTx ' + jobName);
    return await tx.$executeRawUnsafe(`
        insert into pgboss.job (name, data)
        values ($1, $2::jsonb) returning id
    `, jobName, JSON.stringify(data));
  }
}

const pgBossManager = new PgBossManager();

export default pgBossManager;

