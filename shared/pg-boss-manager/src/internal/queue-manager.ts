import {
    BossProvider,
} from './interfaces';
import { Prisma } from '@prisma/client';

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
        const boss = this.bossProvider.getBoss();
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
     * Enqueue job inside database transaction.
     *
     * Useful when business data and job
     * must be committed atomically.
     */
    public async enqueueTx<T extends object>(
        topic: string,
        data: T,
        tx: Pick<Prisma.TransactionClient, '$queryRawUnsafe'>,
    ): Promise<number> {
        const result = await tx.$queryRawUnsafe<
            { id: string }[]
        >(
            `
                insert into pgboss.job(name, data)
                values ($1, $2::jsonb)
                    returning id
            `,
            topic,
            JSON.stringify(data),
        );
        if (!result.length) {
            throw new Error(
                `Failed enqueue job: ${topic}`,
            );
        }

        return Number(result[0].id);
    }

}