import { Store, load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useState } from "react";

type TauriStore = {
  token?: string;
  vaults?: {
    id: string;
    name: string;
  }[];
};

/**
 * Hook to interact with Tauri's key-value store
 * @param key The key to access in the store
 * @param initialValue Optional initial value if the key doesn't exist
 * @returns A tuple containing the value and a setter function
 */
export function useTauriStore<K extends keyof TauriStore>(
  key: K,
  initialValue?: TauriStore[K],
) {
  const [value, setValue] = useState<TauriStore[K] | null>(
    initialValue ?? null,
  );
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the store and load the value
  useEffect(() => {
    const initStore = async () => {
      try {
        setIsLoading(true);
        const storeInstance = await load("store.json", { autoSave: true });
        setStore(storeInstance);

        // Get the initial value from the store
        try {
          const storedValue = await storeInstance.get<TauriStore[K]>(key);
          if (storedValue !== null && storedValue !== undefined) {
            setValue(storedValue);
          }

          // Subscribe to changes for this key
          const unsubscribe = await storeInstance.onKeyChange<TauriStore[K]>(
            key,
            (newValue) => {
              if (newValue !== null && newValue !== undefined) {
                setValue(newValue);
              }
            },
          );

          // Return cleanup function to unsubscribe when component unmounts
          return () => {
            unsubscribe();
          };
        } catch (err) {
          console.error(`Error loading value for key ${String(key)}:`, err);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    const cleanup = initStore();
    return () => {
      cleanup.then((unsub) => unsub && unsub());
    };
  }, [key]);

  // Update the value in the store
  const updateValue = useCallback(
    async (newValue: TauriStore[K]) => {
      setValue(newValue);

      if (!store) return;

      try {
        await store.set(key as string, newValue);
        // With autoSave: true, we don't need to call store.save()
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error(`Error saving value for key ${String(key)}:`, err);
      }
    },
    [store, key],
  );

  return {
    data: value,
    update: updateValue,
    isLoading,
    error,
  };
}
