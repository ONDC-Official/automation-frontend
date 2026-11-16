/** FNV-1a (32-bit) of a string, hex: a cheap "is this still the base text?" check. */
export const fnv1a = (text: string): string => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
};

/** True when `text` is (almost certainly) the base it was hashed from. */
export const matchesBase = (text: string, base: { baseHash: string; baseSize: number }) =>
    text.length === base.baseSize && fnv1a(text) === base.baseHash;
