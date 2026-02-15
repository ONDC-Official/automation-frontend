import readmeRaw from "./x_validations_readme.md?raw";

const readme = typeof readmeRaw === "string" ? readmeRaw : "";

const ruleNameRe = /####\s+\*\*([A-Z0-9_]+)\*\*/g;
/** Inline pattern: "- **NAME** : message" (group/parent rules). */
const inlineRuleRe = /^\s*-\s+\*\*([A-Z0-9_]+)\*\*\s*:\s*(.+)$/gm;

let cachedMap: Record<string, string> | null = null;
let cachedSkipIfMap: Record<string, string> | null = null;

const SUB_CONDITIONS_INTRO =
    "All the following sub conditions must pass as per the api requirement";

/** Extract "Skip if" block from a segment (text after #### **NAME** until next ####). */
function extractSkipIf(segment: string): string | undefined {
    const skipIfMatch = segment.match(/\*\*Skip if:\*\*\s*\n\s*>\s*\n((?:\s*>.*\n?)*)/);
    if (!skipIfMatch) return undefined;
    const block = skipIfMatch[1];
    const lines = block
        .split(/\n/)
        .map((line) => line.replace(/^\s*>\s*/, "").trim())
        .filter(Boolean);
    if (lines.length === 0) return undefined;
    return lines.join("\n");
}

function parseReadme(): Record<string, string> {
    if (cachedMap) return cachedMap;
    const map: Record<string, string> = {};
    let match: RegExpExecArray | null;

    ruleNameRe.lastIndex = 0;
    while ((match = ruleNameRe.exec(readme)) !== null) {
        const name = match[1];
        const start = match.index + match[0].length;
        const tail = readme.slice(start);
        const nextRule = tail.search(/\n\s*####\s+\*\*/);
        const segment = nextRule >= 0 ? tail.slice(0, nextRule) : tail;
        const bulletMatch = segment.match(/^\s*-\s+(.+)$/m);
        if (bulletMatch) {
            const line = bulletMatch[0];
            if (!line.trimStart().startsWith(">")) {
                const msg = bulletMatch[1].trim();
                if (msg && !msg.startsWith("**")) map[name] = msg;
            }
        }
    }

    inlineRuleRe.lastIndex = 0;
    while ((match = inlineRuleRe.exec(readme)) !== null) {
        const name = match[1];
        const msg = match[2].trim();
        if (msg && !(name in map)) map[name] = msg;
    }

    cachedMap = map;
    return map;
}

function parseSkipIfMap(): Record<string, string> {
    if (cachedSkipIfMap) return cachedSkipIfMap;
    const map: Record<string, string> = {};
    let match: RegExpExecArray | null;
    ruleNameRe.lastIndex = 0;
    while ((match = ruleNameRe.exec(readme)) !== null) {
        const name = match[1];
        const start = match.index + match[0].length;
        const tail = readme.slice(start);
        const nextRule = tail.search(/\n\s*####\s+\*\*/);
        const segment = nextRule >= 0 ? tail.slice(0, nextRule) : tail;
        const skipIf = extractSkipIf(segment);
        if (skipIf) map[name] = skipIf;
    }
    cachedSkipIfMap = map;
    return map;
}

/**
 * Returns the human-readable validation message for a rule name (e.g. REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE),
 * or undefined if not found in the readme.
 */
export function getReadmeMessage(ruleName: string): string | undefined {
    if (!ruleName) return undefined;
    return parseReadme()[ruleName];
}

/** Intro line for the X-Validations section (from readme group rules). */
export function getValidationsIntroMessage(): string {
    return SUB_CONDITIONS_INTRO;
}

/**
 * Returns the "Skip if" condition text for a rule name, or undefined if not in the readme.
 */
export function getReadmeSkipIf(ruleName: string): string | undefined {
    if (!ruleName) return undefined;
    return parseSkipIfMap()[ruleName];
}
