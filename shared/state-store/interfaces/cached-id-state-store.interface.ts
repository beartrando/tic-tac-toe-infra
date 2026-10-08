import Id from '../common/value-objects/id.vo';

export interface CachedIdStateStoreInterface<
    TEntity extends { id: Id<any> },
> {
    set(entity: TEntity): Promise<void>;

    get(id: TEntity["id"]): Promise<TEntity | null>;

    delete(id: TEntity["id"]): Promise<void>;

    clear(): Promise<void>;

    restore(): Promise<TEntity[]>;
}

export default CachedIdStateStoreInterface;