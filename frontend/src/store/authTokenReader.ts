let readAuthToken: (() => string | null) | null = null;

/** Registered once at store init so axios interceptors can read the token without importing the store. */
export const registerAuthTokenReader = (reader: () => string | null): void => {
    readAuthToken = reader;
};

export const getAuthTokenFromStore = (): string | null => readAuthToken?.() ?? null;
