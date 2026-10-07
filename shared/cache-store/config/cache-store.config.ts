export const cacheStoreConfig = {} as const;

export type CacheStoreKey = keyof typeof cacheStoreConfig;

export type CacheStoreEntity<K extends CacheStoreKey> = typeof cacheStoreConfig[K];

export default cacheStoreConfig;