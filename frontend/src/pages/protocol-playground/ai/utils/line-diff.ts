export type DiffOp = "+" | "-" | "=";

export interface DiffRow {
    op: DiffOp;
    oldNum?: number;
    newNum?: number;
    text: string;
}

/**
 * O(n*m) LCS line diff. Fine for the file sizes we see (<1000 lines).
 * Returns rows in original document order: equal lines, deletions, and
 * insertions interleaved correctly.
 */
export function lineDiff(oldText: string, newText: string): DiffRow[] {
    const a = oldText.split("\n");
    const b = newText.split("\n");
    const n = a.length;
    const m = b.length;

    const dp: number[][] = Array.from({ length: n + 1 }, () =>
        new Array<number>(m + 1).fill(0)
    );
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    const out: DiffRow[] = [];
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            out.push({ op: "=", oldNum: i, newNum: j, text: a[i - 1] });
            i--;
            j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            out.push({ op: "-", oldNum: i, text: a[i - 1] });
            i--;
        } else {
            out.push({ op: "+", newNum: j, text: b[j - 1] });
            j--;
        }
    }
    while (i > 0) {
        out.push({ op: "-", oldNum: i, text: a[i - 1] });
        i--;
    }
    while (j > 0) {
        out.push({ op: "+", newNum: j, text: b[j - 1] });
        j--;
    }
    return out.reverse();
}

export interface DiffStats {
    added: number;
    removed: number;
}

export function diffStats(rows: DiffRow[]): DiffStats {
    let added = 0;
    let removed = 0;
    for (const r of rows) {
        if (r.op === "+") added++;
        else if (r.op === "-") removed++;
    }
    return { added, removed };
}
