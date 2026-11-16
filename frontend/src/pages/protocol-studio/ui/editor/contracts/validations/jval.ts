/**
 * The JVAL return/continue expression language, as the validation compiler
 * (ondc-code-generator `return-complier/tokens.js`) defines it: identifiers,
 * two unary and seven binary operators (case-insensitive), `!`, `&&`, `||`
 * and parentheses. `&&` binds tighter than `||`.
 */

export type UnaryOp = "are present" | "are unique";
export type BinaryOp =
    | "all in"
    | "any in"
    | "none in"
    | "follow regex"
    | "equal to"
    | "greater than"
    | "less than";

export type JvalExpr =
    | { kind: "unary"; op: UnaryOp; subject: string }
    | { kind: "binary"; op: BinaryOp; subject: string; object: string }
    | { kind: "not"; expr: JvalExpr }
    | { kind: "and" | "or"; left: JvalExpr; right: JvalExpr };

export const UNARY_OPS: UnaryOp[] = ["are present", "are unique"];
export const BINARY_OPS: BinaryOp[] = [
    "all in",
    "any in",
    "none in",
    "follow regex",
    "equal to",
    "greater than",
    "less than",
];

type Token =
    | { type: "id"; value: string; from: number; to: number }
    | { type: "op"; value: UnaryOp | BinaryOp; from: number; to: number }
    | { type: "(" | ")" | "!" | "&&" | "||"; from: number; to: number };

const OPERATOR = new RegExp(
    `^(${[...UNARY_OPS, ...BINARY_OPS].map((o) => o.replace(" ", "\\s+")).join("|")})`,
    "i"
);

export class JvalSyntaxError extends Error {
    constructor(
        message: string,
        readonly at: number
    ) {
        super(message);
    }
}

export const tokenizeJval = (source: string): Token[] => {
    const tokens: Token[] = [];
    let at = 0;
    while (at < source.length) {
        const rest = source.slice(at);
        const space = /^\s+/.exec(rest);
        if (space) {
            at += space[0].length;
            continue;
        }
        const op = OPERATOR.exec(rest);
        // An operator word only counts at a word boundary (`all inside` is an identifier pair).
        if (op && !/[a-zA-Z0-9_]/.test(rest[op[0].length] ?? "")) {
            const value = op[0].toLowerCase().replace(/\s+/g, " ") as UnaryOp | BinaryOp;
            tokens.push({ type: "op", value, from: at, to: at + op[0].length });
            at += op[0].length;
            continue;
        }
        const id = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(rest);
        if (id) {
            tokens.push({ type: "id", value: id[0], from: at, to: at + id[0].length });
            at += id[0].length;
            continue;
        }
        const two = rest.slice(0, 2);
        if (two === "&&" || two === "||") {
            tokens.push({ type: two, from: at, to: at + 2 });
            at += 2;
            continue;
        }
        const one = rest[0];
        if (one === "(" || one === ")" || one === "!") {
            tokens.push({ type: one, from: at, to: at + 1 });
            at += 1;
            continue;
        }
        throw new JvalSyntaxError(`Unexpected "${one}"`, at);
    }
    return tokens;
};

/** Parses a JVAL expression. Throws `JvalSyntaxError` with the offset of the problem. */
export const parseJval = (source: string): JvalExpr => {
    const tokens = tokenizeJval(source);
    let i = 0;
    const peek = () => tokens[i];
    const end = source.length;
    const expect = (what: string): never => {
        throw new JvalSyntaxError(`Expected ${what}`, peek()?.from ?? end);
    };

    const parseOr = (): JvalExpr => {
        let left = parseAnd();
        while (peek()?.type === "||") {
            i++;
            left = { kind: "or", left, right: parseAnd() };
        }
        return left;
    };
    const parseAnd = (): JvalExpr => {
        let left = parseUnary();
        while (peek()?.type === "&&") {
            i++;
            left = { kind: "and", left, right: parseUnary() };
        }
        return left;
    };
    const parseUnary = (): JvalExpr => {
        const token = peek();
        if (!token) return expect("an expression");
        if (token.type === "!") {
            i++;
            return { kind: "not", expr: parseUnary() };
        }
        if (token.type === "(") {
            i++;
            const inner = parseOr();
            if (peek()?.type !== ")") expect(`")"`);
            i++;
            return inner;
        }
        if (token.type !== "id") return expect("a variable name");
        i++;
        const op = peek();
        if (op?.type !== "op")
            return expect(`an operator (${[...UNARY_OPS, ...BINARY_OPS].join(", ")})`);
        i++;
        if ((UNARY_OPS as string[]).includes(op.value)) {
            return { kind: "unary", op: op.value as UnaryOp, subject: token.value };
        }
        const object = peek();
        if (object?.type !== "id") return expect("a variable name after the operator");
        i++;
        return {
            kind: "binary",
            op: op.value as BinaryOp,
            subject: token.value,
            object: object.value,
        };
    };

    const expr = parseOr();
    if (i < tokens.length) expect("&&, || or the end");
    return expr;
};

export const tryParseJval = (source: string): { ast: JvalExpr } | { error: string; at: number } => {
    try {
        return { ast: parseJval(source) };
    } catch (e) {
        if (e instanceof JvalSyntaxError) return { error: e.message, at: e.at };
        return { error: e instanceof Error ? e.message : String(e), at: 0 };
    }
};

/** Every variable an expression names, in order of first use. */
export const jvalVariables = (expr: JvalExpr): string[] => {
    const out: string[] = [];
    const add = (name: string) => {
        if (!out.includes(name)) out.push(name);
    };
    const walk = (e: JvalExpr) => {
        if (e.kind === "unary") add(e.subject);
        else if (e.kind === "binary") {
            add(e.subject);
            add(e.object);
        } else if (e.kind === "not") walk(e.expr);
        else {
            walk(e.left);
            walk(e.right);
        }
    };
    walk(expr);
    return out;
};

/** Renames a variable in an expression, touching identifier tokens only (spacing kept). */
export const renameJvalVariable = (source: string, from: string, to: string): string => {
    let tokens: Token[];
    try {
        tokens = tokenizeJval(source);
    } catch {
        return source;
    }
    let out = "";
    let at = 0;
    for (const token of tokens) {
        if (token.type === "id" && token.value === from) {
            out += source.slice(at, token.from) + to;
            at = token.to;
        }
    }
    return out + source.slice(at);
};

// ─── Reading an expression as a sentence ─────────────────────────────────────

/** What a variable stands for, for the sentence: a path, a list of values, or something else. */
export interface JvalOperand {
    name: string;
    kind: "path" | "list" | "scalar" | "unknown";
    /** The path (made absolute with the scope) or the values. */
    path?: string;
    values?: string[];
    value?: string;
}

export type SentencePart =
    | string
    | { kind: "path"; name: string; path: string }
    | { kind: "values"; name: string; values: string[] }
    | { kind: "var"; name: string; known: boolean };

const operandPart = (operand: JvalOperand | undefined, name: string): SentencePart => {
    if (operand?.kind === "path" && operand.path) return { kind: "path", name, path: operand.path };
    if (operand?.kind === "list" && operand.values)
        return { kind: "values", name, values: operand.values };
    if (operand?.kind === "scalar" && operand.value !== undefined) {
        return { kind: "values", name, values: [operand.value] };
    }
    return { kind: "var", name, known: !!operand };
};

const PHRASES: Record<UnaryOp | BinaryOp, [string, string, string]> = {
    "are present": ["", " must be present", ""],
    "are unique": ["", " must be unique", ""],
    "all in": ["every ", " must be one of ", ""],
    "any in": ["at least one ", " must be one of ", ""],
    "none in": ["no ", " may be one of ", ""],
    "follow regex": ["", " must match ", ""],
    "equal to": ["", " must equal ", ""],
    "greater than": ["", " must be greater than ", ""],
    "less than": ["", " must be less than ", ""],
};

/** The second half of "present, and …" for each binary operator. */
const THEN: Record<BinaryOp, string> = {
    "all in": " every value one of ",
    "any in": " at least one value one of ",
    "none in": " no value one of ",
    "follow regex": " matching ",
    "equal to": " equal to ",
    "greater than": " greater than ",
    "less than": " less than ",
};

const NEGATED: Record<UnaryOp | BinaryOp, string> = {
    "are present": " is absent",
    "are unique": " has duplicates",
    "all in": " is not all within ",
    "any in": " has none of ",
    "none in": " has any of ",
    "follow regex": " doesn't match ",
    "equal to": " differs from ",
    "greater than": " is not greater than ",
    "less than": " is not less than ",
};

const CONDITION: Record<UnaryOp | BinaryOp, string> = {
    "are present": " is present",
    "are unique": " is unique",
    "all in": " is one of ",
    "any in": " includes any of ",
    "none in": " has none of ",
    "follow regex": " matches ",
    "equal to": " equals ",
    "greater than": " is greater than ",
    "less than": " is less than ",
};

type Lookup = (name: string) => JvalOperand | undefined;

const describe = (expr: JvalExpr, lookup: Lookup, mode: "rule" | "condition"): SentencePart[] => {
    if (expr.kind === "unary" || expr.kind === "binary") {
        const subject = operandPart(lookup(expr.subject), expr.subject);
        const object =
            expr.kind === "binary" ? operandPart(lookup(expr.object), expr.object) : null;
        if (mode === "condition") return [subject, CONDITION[expr.op], ...(object ? [object] : [])];
        const [lead, mid, tail] = PHRASES[expr.op];
        return [lead, subject, mid, ...(object ? [object] : []), tail].filter((p) => p !== "");
    }
    if (expr.kind === "not") {
        const inner = expr.expr;
        if (inner.kind === "unary" || inner.kind === "binary") {
            const subject = operandPart(lookup(inner.subject), inner.subject);
            const object =
                inner.kind === "binary" ? operandPart(lookup(inner.object), inner.object) : null;
            return [subject, NEGATED[inner.op], ...(object ? [object] : [])];
        }
        return ["not (", ...describe(inner, lookup, mode), ")"];
    }
    // `attr are present && attr all in enumList`: one subject, said once.
    if (
        expr.kind === "and" &&
        expr.left.kind === "unary" &&
        expr.left.op === "are present" &&
        expr.right.kind === "binary" &&
        expr.right.subject === expr.left.subject &&
        mode === "rule"
    ) {
        const subject = operandPart(lookup(expr.left.subject), expr.left.subject);
        const object = operandPart(lookup(expr.right.object), expr.right.object);
        return [subject, " must be present,", THEN[expr.right.op], object];
    }
    const joiner = expr.kind === "and" ? " and " : " or ";
    const wrap = (e: JvalExpr) =>
        e.kind === "or" && expr.kind === "and"
            ? ["(", ...describe(e, lookup, mode), ")"]
            : describe(e, lookup, mode);
    return [...wrap(expr.left), joiner, ...wrap(expr.right)];
};

/** A rule's `_RETURN_` as a sentence: "`$.context.action` must be present, and every value one of [search]". */
export const describeRule = (expr: JvalExpr, lookup: Lookup): SentencePart[] =>
    describe(expr, lookup, "rule");

export interface GuardSummary {
    /** "only when …" / "skipped when …". */
    parts: SentencePart[];
    /** The common "only when <path> is one of <values>" shape, for filtering by use case. */
    only?: { path: string; values: string[] } | { path: string; present: true };
}

/**
 * A `_CONTINUE_` (skip when true) as when the test applies:
 * `!(useCasePath all in useCode)` → "only when … is one of [METRO]".
 */
export const describeGuard = (expr: JvalExpr, lookup: Lookup): GuardSummary => {
    if (expr.kind === "not") {
        const inner = expr.expr;
        const subject =
            inner.kind === "unary" || inner.kind === "binary" ? lookup(inner.subject) : undefined;
        if (inner.kind === "binary" && (inner.op === "all in" || inner.op === "any in")) {
            const object = lookup(inner.object);
            const parts = ["only when ", ...describe(inner, lookup, "condition")];
            if (subject?.kind === "path" && subject.path && object?.values) {
                return { parts, only: { path: subject.path, values: object.values } };
            }
            return { parts };
        }
        if (inner.kind === "unary" && inner.op === "are present") {
            const parts = ["only when ", ...describe(inner, lookup, "condition")];
            if (subject?.kind === "path" && subject.path)
                return { parts, only: { path: subject.path, present: true } };
            return { parts };
        }
        return { parts: ["only when ", ...describe(inner, lookup, "condition")] };
    }
    return { parts: ["skipped when ", ...describe(expr, lookup, "condition")] };
};

/** Plain text of sentence parts (search, titles). */
export const sentenceText = (parts: SentencePart[]): string =>
    parts
        .map((part) => {
            if (typeof part === "string") return part;
            if (part.kind === "path") return part.path;
            if (part.kind === "values") return `[${part.values.join(", ")}]`;
            return part.name;
        })
        .join("");
