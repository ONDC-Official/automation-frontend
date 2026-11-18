import type {
    PinId,
    StudioEdge,
    StudioNode,
    StudioDecision,
} from "@pages/protocol-studio/ui/editor/types";

/** The cases a new decision node starts with. */
export const DEFAULT_CASES = ["yes", "no"];

/** The out pin a case's wire leaves from. */
export const getCasePin = (value: string): PinId => `case:${value}`;

/** The case an out pin stands for; null for any other pin. */
export const getPinCase = (pin: string | null | undefined) =>
    pin?.startsWith("case:") ? pin.slice("case:".length) : null;

/** `decide`'s return type: the cases as a union of string literals. */
const caseUnion = (cases: string[]) =>
    cases.length > 0 ? cases.map((value) => JSON.stringify(value)).join(" | ") : "never";

type DecisionShape = Omit<StudioDecision, "decide">;

/**
 * A new `decide` for a decision with these cases. A decision is a *protocol*
 * decision: it reads only what earlier steps saved. Nothing is asked of the
 * tester here — a choice the protocol cannot make from state is an
 * alternative (several wires out of one pin), resolved by a journey.
 */
export const getDecideTemplate = (shape: DecisionShape): string => {
    const union = caseUnion(shape.cases);
    return [
        "/**",
        " * Picks the case to take, from what earlier steps saved. The protocol",
        " * decides here: exactly one case is legal given the session so far.",
        " * @param sessionData Values saved by earlier steps (see the session schema).",
        " * @returns One of this node's cases: the wire on that pin is followed.",
        " */",
        `function decide(sessionData: SessionData): ${union} {`,
        `    return ${JSON.stringify(shape.cases[0] ?? "")};`,
        "}",
        "",
    ].join("\n");
};

const DECIDE_HEADER = /function\s+decide\s*\(([^)]*)\)\s*(?::\s*[^{]*?)?\s*\{/;

/**
 * Rewrites `decide`'s return type for the decision's cases, keeping the body
 * and the type `sessionData` is given. Code whose header can't be found is
 * left alone: TypeScript then points at the mismatch.
 */
export const syncDecideSignature = (source: string, shape: DecisionShape): string => {
    const match = DECIDE_HEADER.exec(source);
    if (!match) return source;
    const sessionType = /sessionData\s*:\s*([A-Za-z_$][\w$]*)/.exec(match[1])?.[1] ?? "SessionData";
    const header = `function decide(sessionData: ${sessionType}): ${caseUnion(shape.cases)} {`;
    return source.slice(0, match.index) + header + source.slice(match.index + match[0].length);
};

/** A decision node's wires, by the case they are taken on. */
export const getCaseWires = (nodeId: string, edges: StudioEdge[]) => {
    const wires = new Map<string, StudioEdge>();
    for (const edge of edges) {
        if (edge.from === nodeId && edge.case !== undefined && !wires.has(edge.case)) {
            wires.set(edge.case, edge);
        }
    }
    return wires;
};

/** The first case with nothing wired to it yet, else the first case. */
export const getFreeCase = (node: StudioNode, edges: StudioEdge[]) => {
    const cases = node.decision?.cases ?? [];
    const wires = getCaseWires(node.id, edges);
    return cases.find((value) => !wires.has(value)) ?? cases[0];
};

/** A case name the node can take: non-empty, not one it already has. Returns an error, or null. */
export const checkCaseName = (value: string, others: string[]) => {
    if (value === "") return "A case needs a name";
    if (others.includes(value)) return `"${value}" is already a case`;
    return null;
};
