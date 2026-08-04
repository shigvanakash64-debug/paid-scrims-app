const STORAGE_KEY_PREFIX = 'clutchzone_payment_verification';

const createMemoryStorage = () => {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
};

const memoryStore = createMemoryStorage();

const resolveStorage = (storage) => {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return memoryStore;
};

const isBrowserStorage = (storage) => Boolean(storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function');

const serializeValue = (value) => {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const deserializeValue = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const readStorageValue = (storage, key) => {
  if (storage?.getItem) return storage.getItem(key);
  if (storage?.get) return storage.get(key) ?? null;
  return null;
};

const writeStorageValue = (storage, key, value) => {
  if (isBrowserStorage(storage)) {
    storage.setItem(key, serializeValue(value));
    return;
  }
  if (storage?.set) {
    storage.set(key, value);
  }
};

const removeStorageValue = (storage, key) => {
  if (storage?.removeItem) {
    storage.removeItem(key);
    return;
  }
  if (storage?.delete) {
    storage.delete(key);
  }
};

export const getPaymentVerificationStorageKey = (orderId) => `${STORAGE_KEY_PREFIX}:${orderId}`;

export const readPaymentVerificationState = (orderId, storage = null) => {
  if (!orderId) return null;

  const targetStorage = resolveStorage(storage);
  try {
    const raw = readStorageValue(targetStorage, getPaymentVerificationStorageKey(orderId));
    return raw == null ? null : deserializeValue(raw);
  } catch (error) {
    console.warn('Failed to read payment verification state', error);
    return null;
  }
};

export const writePaymentVerificationState = (orderId, state, storage = null) => {
  if (!orderId) return state;

  const targetStorage = resolveStorage(storage);
  try {
    writeStorageValue(targetStorage, getPaymentVerificationStorageKey(orderId), state);
  } catch (error) {
    console.warn('Failed to persist payment verification state', error);
  }

  return state;
};

export const clearPaymentVerificationState = (orderId, storage = null) => {
  if (!orderId) return;

  const targetStorage = resolveStorage(storage);
  try {
    removeStorageValue(targetStorage, getPaymentVerificationStorageKey(orderId));
  } catch (error) {
    console.warn('Failed to clear payment verification state', error);
  }
};
