/**
 * Stand-in for @ondc/ondc-automation-cache-lib. The real module opens a Redis
 * connection at import time, which a unit test should not reach for — and the
 * package is private, so it is not always installed.
 *
 * Backed by a plain Map so a test can seed a session and then assert on what
 * the code under test wrote back. Call `__reset()` between tests.
 */
const store = new Map<string, string>();

export const RedisService = {
	__store: store,
	__reset: () => store.clear(),

	getKey: async (key: string): Promise<string | null> => store.get(key) ?? null,
	setKey: async (key: string, value: string, _expiry?: number): Promise<void> => {
		store.set(key, value);
	},
	keyExists: async (key: string): Promise<boolean> => store.has(key),
	deleteKey: async (key: string): Promise<void> => {
		store.delete(key);
	},
	useDb: (_db: number): void => {},
	subscribeToDb: (): void => {},
};
