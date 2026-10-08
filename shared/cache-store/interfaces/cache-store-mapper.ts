export interface CacheStoreMapper<TEntity> {
    toPersistence(entity: TEntity): unknown;

    toDomain(data: unknown): TEntity;
}

export default CacheStoreMapper;