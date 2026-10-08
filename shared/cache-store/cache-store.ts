import CacheStoreInterface from './interfaces/cache-store.interface';
import CacheStoreMapper from './interfaces/cache-store-mapper';

export class CacheStore<TEntity extends { id: any }>
    implements CacheStoreInterface<TEntity>
{
    constructor(
        private readonly prefix: string,
        private readonly index: string,
        private readonly mapper: CacheStoreMapper<TEntity>,
    ) {
    }

    private _client?: any;

    protected get client(): any {
        if (!this._client) {
            throw new Error('Redis client is not initialized');
        }

        return this._client;
    }

    setClient(client: any): void {
        this._client = client;
    }

    async set(entity: TEntity): Promise<void> {
        const key = `${this.prefix}${entity.id.value}`;

        await this.client.set(
            key,
            JSON.stringify(this.mapper.toPersistence(entity))
        );

        await this.client.sadd(
            this.index,
            entity.id.value,
        );
    }

    async get(id: any): Promise<TEntity | null> {
        const data = await this.client.get(
            `${this.prefix}${id.value}`,
        );

        if (!data) {
            return null;
        }

        return this.mapper.toDomain(JSON.parse(data));
    }

    async exists(id: any): Promise<boolean> {
        return this.client.exists(
            `${this.prefix}${id.value}`,
        ).then(Boolean);
    }

    async clear(): Promise<void> {
        const ids = await this.client.smembers(this.index);

        if (!ids.length) {
            return;
        }

        const keys = ids.map(
            id => `${this.prefix}${id}`,
        );

        await this.client.del(...keys);
        await this.client.del(this.index);
    }

    async invalidate(id: any): Promise<void> {
        await this.client.del(
            `${this.prefix}${id.value}`,
        );

        await this.client.srem(
            this.index,
            id.value,
        );
    }

    async loadAll(): Promise<TEntity[]> {
        const ids = await this.client.smembers(this.index);

        if (!ids.length) {
            return [];
        }

        const keys = ids.map(
            id => `${this.prefix}${id}`,
        );

        const values = await this.client.mget(keys);

        return values
            .filter(
                (value): value is string => value !== null,
            )
            .map(
                value => this.mapper.toDomain(JSON.parse(value)),
            );
    }
}