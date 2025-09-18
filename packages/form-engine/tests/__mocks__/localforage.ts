interface Store {
  ready: () => Promise<void>;
  getItem: <T>(key: string) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<T>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  iterate: <T, R>(iterator: (value: T, key: string) => R | Promise<R>) => Promise<void>;
}

const stores = new Map<string, Map<string, unknown>>();

function getStoreKey(name?: string, storeName?: string): string {
  return `${name ?? 'default'}:${storeName ?? 'store'}`;
}

function getStore(name?: string, storeName?: string): Map<string, unknown> {
  const key = getStoreKey(name, storeName);
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  return stores.get(key)!;
}

function createStore(name?: string, storeName?: string): Store {
  const store = getStore(name, storeName);

  return {
    async ready() {
      return Promise.resolve();
    },
    async getItem<T>(key: string) {
      return (store.get(key) as T | undefined) ?? null;
    },
    async setItem<T>(key: string, value: T) {
      store.set(key, value);
      return value;
    },
    async removeItem(key: string) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
    async iterate<T, R>(iterator: (value: T, key: string) => R | Promise<R>) {
      for (const [key, value] of store.entries()) {
        await iterator(value as T, key);
      }
    },
  };
}

const localforage = {
  INDEXEDDB: 'indexeddb',
  WEBSQL: 'websql',
  LOCALSTORAGE: 'localstorage',
  createInstance(options: { name?: string; storeName?: string } = {}) {
    return createStore(options.name, options.storeName);
  },
  async ready() {
    return Promise.resolve();
  },
  async getItem<T>(key: string) {
    return createStore().getItem<T>(key);
  },
  async setItem<T>(key: string, value: T) {
    return createStore().setItem(key, value);
  },
  async removeItem(key: string) {
    return createStore().removeItem(key);
  },
  async clear() {
    return createStore().clear();
  },
  async iterate<T, R>(iterator: (value: T, key: string) => R | Promise<R>) {
    return createStore().iterate(iterator);
  },
};

export default localforage;
export const { INDEXEDDB, WEBSQL, LOCALSTORAGE } = localforage;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(module.exports as any) = localforage;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(module.exports as any).default = localforage;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(module.exports as any).INDEXEDDB = localforage.INDEXEDDB;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(module.exports as any).WEBSQL = localforage.WEBSQL;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(module.exports as any).LOCALSTORAGE = localforage.LOCALSTORAGE;
