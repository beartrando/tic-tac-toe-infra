import { Job } from 'pg-boss';

export type PgBossConfig = {
  max?: number;
  newConnectionTimeoutSeconds?: number;
  maintenanceIntervalSeconds?: number;
  applicationName: string;
};

export type WorkerHandler<T> = (
    message: T,
) => Promise<void>;

export type BatchWorkerHandler<T> = (
    messages: T[],
) => Promise<void>;

export type WorkerRegistration<T = unknown> = {
  topic: string;
  batchSize: number;
  handler: WorkerHandler<T>;
};

export type BatchWorkerRegistration<T = unknown> = {
  topic: string;
  batchSize: number;
  handler: BatchWorkerHandler<T>;
};

/**
 * Внутренний тип.
 * Используется только PgBossManager при восстановлении воркеров.
 */
export type InternalWorkerRegistration = {
  topic: string;
  register: (jobs: Job[]) => Promise<void>;
};
