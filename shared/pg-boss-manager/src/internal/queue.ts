import { PgBossManager } from './manager';

export class Publisher {

    constructor(
        private readonly manager: PgBossManager,
    ) {
    }

    /**
     * Enqueue message.
     */
    public async enqueue<T>(
        topic: string,
        data: T,
    ): Promise<number> {

        const id = await this.manager
            .getBoss()
            .send(topic, data);

        if (!id) {
            throw new Error(
                `Failed enqueue "${topic}"`,
            );
        }

        return Number(id);
    }

    /**
     * Enqueue message inside transaction.
     */
    public async enqueueTx<T>(
        topic: string,
        data: T,
        tx: {
            $executeRawUnsafe(
                query: string,
                ...params: unknown[]
            ): Promise<unknown>;
        },
    ): Promise<unknown> {

        return tx.$executeRawUnsafe(
            `
            INSERT INTO pgboss.job(name, data)
            VALUES ($1, $2::jsonb)
            RETURNING id
            `,
            topic,
            JSON.stringify(data),
        );
    }
}
