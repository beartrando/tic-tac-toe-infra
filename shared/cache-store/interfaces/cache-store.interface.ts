export interface CacheStoreInterface<TEntity extends { id: any }> {
    setClient(client: any): void;

    set(entity: TEntity): Promise<void>;

    get(id: any): Promise<TEntity | null>;

    invalidate(id: any): Promise<void>;

    exists(id: any): Promise<boolean>;

    loadAll(): Promise<TEntity[]>;

    clear(): Promise<void>;
}

export default CacheStoreInterface;