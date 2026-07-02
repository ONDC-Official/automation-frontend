export const filterJsonBySearch = (data: unknown, query: string): unknown => {
    if (!query) return data;
    const q = query.toLowerCase();
    const primitiveMatches = (val: unknown): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === "string") return val.toLowerCase().includes(q);
        if (typeof val === "number" || typeof val === "boolean") return `${val}`.includes(q);
        return false;
    };
    const walk = (val: unknown): unknown => {
        if (Array.isArray(val)) {
            const filtered = val.map(walk).filter((item) => item !== undefined);
            return filtered.length ? filtered : undefined;
        }
        if (val && typeof val === "object") {
            const result: Record<string, unknown> = {};
            let hasMatch = false;
            for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
                if (key.toLowerCase().includes(q)) {
                    result[key] = value;
                    hasMatch = true;
                    continue;
                }
                const child = walk(value);
                if (child !== undefined) {
                    result[key] = child;
                    hasMatch = true;
                }
            }
            return hasMatch ? result : undefined;
        }
        return primitiveMatches(val) ? val : undefined;
    };
    const result = walk(data);
    return result === undefined ? {} : result;
};

export const hasVisibleResults = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value as object).length > 0;
    return Boolean(value);
};
