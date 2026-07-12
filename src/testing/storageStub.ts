/**
 * Under `tsx --test` there is no React Native runtime, so
 * @react-native-async-storage/async-storage resolves to its web build, which
 * writes through `window.localStorage`. The store's `persist` middleware fires
 * those writes asynchronously after every `set`, and they would crash the test
 * run with "window is not defined".
 *
 * Import this module BEFORE the store in any test that touches it.
 */
const memory = new Map<string, string>();

const localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, String(value)),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
};

const globals = globalThis as Record<string, unknown>;
globals.window ??= { localStorage };
globals.localStorage ??= localStorage;

export {};
