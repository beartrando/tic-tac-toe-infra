import {
    BossProvider,
    SqlExecutor,
} from './interfaces';

export class QueueManager {

    constructor(
        private readonly bossProvider: BossProvider,
    ) {}

    /**
     * Enqueue job.
     */
    public async enqueue<T extends object>(
        topic: string,
        data: T,
    ): Promise<number> {
        const boss = await this.bossProvider.waitUntilReady();

        const id = await boss.send(
            topic,
            data,
        );
        if (!id) {
            throw new Error(
                `Failed enqueue job: ${topic}`,
            );
        }
        return Number(id);
    }

    /**
     * Enqueue job inside db transaction.
     *
     * Useful when business data and job
     * must be committed atomically.
     */
    public async enqueueTx<T extends object>(
        topic: string,
        data: T,
        tx: SqlExecutor,
    ): Promise<number> {
        const result = await tx.$queryRawUnsafe<{ id: string }[]>(
            `
                insert into pgboss.job(name, data)
                values ($1, $2::jsonb)
                    returning id
            `,
            topic,
            JSON.stringify(data),
        );

        if (result.length === 0) {
            throw new Error(
                `Failed enqueue job: ${topic}`,
            );
        }

        return Number(result[0].id);
    }

}
