import CachedIdStateStoreInterface from './interfaces/cached-id-state-store.interface';
import { StateStoreEntity, StateStoreKey } from './config/state-store.config';

type AnyStateStore = CachedIdStateStoreInterface<any>;

export class StateStoreService {

    private readonly registry = new Map<
        StateStoreKey,
        AnyStateStore
    >();

    async start(): Promise<void> {
        await this.restore();
    }

    async stop(): Promise<void> {
        await this.clearAll();
    }

    register<K extends StateStoreKey>(
        key: K,
        store: CachedIdStateStoreInterface<StateStoreEntity<K>>,
    ): void {
        if (this.registry.has(key)) {
            throw new Error(
                `State store "${key}" is already registered`,
            );
        }

        this.registry.set(key, store);
    }

    async check(): Promise<boolean> {
        return true;
    }

    store<K extends StateStoreKey>(
        key: K,
    ): CachedIdStateStoreInterface<StateStoreEntity<K>> {
        const store = this.registry.get(key);

        if (!store) {
            throw new Error(
                `State store "${key}" is not registered`,
            );
        }

        return store as CachedIdStateStoreInterface<StateStoreEntity<K>>;
    }

    async clearAll(): Promise<void> {
        // Clear all stored state
        // Implementation depends on the specific store backends
    }

    async restore(): Promise<TEntity[]> {
        // Restore all state from storage
        // Implementation depends on the specific store backends
        return [];
    }
}