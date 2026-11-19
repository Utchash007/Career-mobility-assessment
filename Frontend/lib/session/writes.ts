// Session-local synchronization only. No identity data or global store.
export function createWriteCoordinator() {
  const locks = new Set<string>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isBusy(key: string) {
      return (
        locks.has("application-data") ||
        locks.has(key) ||
        (key === "application-data" && locks.size > 0)
      );
    },
    acquire(key: string) {
      if (
        locks.has("application-data") ||
        locks.has(key) ||
        (key === "application-data" && locks.size > 0)
      )
        return false;
      locks.add(key);
      notify();
      return true;
    },
    release(key: string) {
      locks.delete(key);
      notify();
    },
  };
}
