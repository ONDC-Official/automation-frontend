/** A splice of the file's text: replace `[from, to)` with `insert`. */
export interface TextPatch {
    from: number;
    to: number;
    insert: string;
}

/** Applies patches (any order, never overlapping) to `text`. Throws on overlap. */
export const applyPatches = (text: string, patches: TextPatch[]): string => {
    const sorted = [...patches].sort((a, b) => a.from - b.from || a.to - b.to);
    let out = "";
    let at = 0;
    for (const patch of sorted) {
        if (patch.from < at || patch.to < patch.from || patch.to > text.length) {
            throw new Error("Overlapping or out-of-range text patches");
        }
        out += text.slice(at, patch.from) + patch.insert;
        at = patch.to;
    }
    return out + text.slice(at);
};

/** The patches that undo `patches` (made against `text`) on the text they produced. */
export const invertPatches = (text: string, patches: TextPatch[]): TextPatch[] => {
    const sorted = [...patches].sort((a, b) => a.from - b.from || a.to - b.to);
    let shift = 0;
    return sorted.map((patch) => {
        const from = patch.from + shift;
        const inverse = {
            from,
            to: from + patch.insert.length,
            insert: text.slice(patch.from, patch.to),
        };
        shift += patch.insert.length - (patch.to - patch.from);
        return inverse;
    });
};

/** Start of the line holding `offset`. */
export const lineStart = (text: string, offset: number) => {
    const at = text.lastIndexOf("\n", Math.max(0, offset - 1));
    return offset === 0 ? 0 : at + 1;
};

/** Start of the line after the one holding `offset` (or the end of the text). */
export const nextLineStart = (text: string, offset: number) => {
    const at = text.indexOf("\n", offset);
    return at === -1 ? text.length : at + 1;
};

/** Column (0-based) of `offset` in its line. */
export const columnOf = (text: string, offset: number) => offset - lineStart(text, offset);

/** True when the line starting at `start` has only whitespace. */
export const isBlankLine = (text: string, start: number) => {
    const end = text.indexOf("\n", start);
    return /^\s*$/.test(text.slice(start, end === -1 ? text.length : end));
};

/** Lines changed by going from `before` to `after`: a cheap +added / −removed count for pills. */
export const lineDelta = (before: string, after: string) => {
    if (before === after) return { added: 0, removed: 0 };
    const a = before.split("\n");
    const b = after.split("\n");
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;
    let endA = a.length - 1;
    let endB = b.length - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
        endA--;
        endB--;
    }
    return { added: Math.max(0, endB - start + 1), removed: Math.max(0, endA - start + 1) };
};
