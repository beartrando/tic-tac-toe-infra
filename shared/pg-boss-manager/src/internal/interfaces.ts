import { PgBoss } from 'pg-boss';

export interface BossProvider {

    /**
     * Returns active PgBoss instance.
     *
     * @throws Error if PgBoss is not connected.
     */
    getBoss(): PgBoss;

}

export interface SqlExecutor {
    $queryRawUnsafe<T = unknown>(
        query: string,
        ...values: unknown[]
    ): Promise<T>;
}