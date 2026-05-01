export function createCache(maxItems = 256) {
  const store = new Map();

  function prune() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
    while (store.size > maxItems) {
      const oldestKey = store.keys().next().value;
      if (!oldestKey) break;
      store.delete(oldestKey);
    }
  }

  return {
    async remember(key, ttlMs, load) {
      const now = Date.now();
      const existing = store.get(key);
      if (existing && existing.expiresAt > now) {
        return existing.value;
      }

      const value = await load();
      store.set(key, {
        value,
        expiresAt: now + Math.max(0, ttlMs)
      });
      prune();
      return value;
    }
  };
}
