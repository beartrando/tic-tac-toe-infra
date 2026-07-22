export type PgBossConfig = {
    /**
     * Maximum number of PostgreSQL connections.
     */
    max?: number;

    /**
     * PgBoss maintenance interval in seconds.
     */
    maintenanceIntervalSeconds?: number;

    /**
     * Application name visible in PostgreSQL.
     */
    applicationName: string;
};


export type WorkerHandler<T = unknown> = (
    message: T,
) => Promise<void>;


export type BatchWorkerHandler<T = unknown> = (
    messages: T[],
) => Promise<void>;
