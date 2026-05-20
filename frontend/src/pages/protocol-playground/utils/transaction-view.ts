import MockRunner, { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { getGroupSteps } from "./step-group";

type PlaygroundActionStep = MockPlaygroundConfigType["steps"][number];

/** Resolve a step definition by `action_id` across both the main and extra groups. */
export function findStepDef(
    config: MockPlaygroundConfigType,
    actionId: string
): PlaygroundActionStep | undefined {
    return (
        getGroupSteps(config, "main").find((s) => s.action_id === actionId) ??
        getGroupSteps(config, "extra").find((s) => s.action_id === actionId)
    );
}

/** Normalise a transaction-history `payload` (object | array) to an array of payloads. */
function payloadList(payload: unknown): unknown[] {
    return Array.isArray(payload) ? payload : [payload];
}

/**
 * Returns a step def whose saveData keys are `APPEND#`-prefixed, so MockRunner
 * accumulates (rather than overwrites) values across the step's repeated runs.
 * Already-prefixed keys are left untouched.
 */
function accumulateSaveData(def: PlaygroundActionStep): PlaygroundActionStep {
    const saveData = def.mock.saveData ?? {};
    const next: Record<string, string> = {};
    for (const key in saveData) {
        next[key.startsWith("APPEND#") ? key : `APPEND#${key}`] = saveData[key];
    }
    return { ...def, mock: { ...def.mock, saveData: next } };
}

/**
 * Builds a config whose `steps` and `transaction_history` are positionally aligned
 * and one-payload-per-entry: an extra step that ran N times (its entry holds a
 * payload array of length N) is exploded into N synthetic entries + N step copies.
 *
 * The result is safe to feed to `new MockRunner(...)` — `getSessionDataUpToStep`
 * maps entry `i` to `steps[i]` positionally and treats each payload as one object.
 *
 * When `accumulateExtra` is set, a multi-run extra step's saveData keys are
 * `APPEND#`-prefixed so EVERY run contributes to the session (not just the last).
 */
export function buildLinearConfig(
    config: MockPlaygroundConfigType,
    accumulateExtra = false
): MockPlaygroundConfigType {
    const steps: PlaygroundActionStep[] = [];
    const transaction_history: MockPlaygroundConfigType["transaction_history"] = [];

    for (const entry of config.transaction_history) {
        const def = findStepDef(config, entry.action_id);
        if (!def) continue;
        const payloads = payloadList(entry.payload);
        // An array payload identifies an extra step that ran one or more times.
        const effectiveDef =
            accumulateExtra && Array.isArray(entry.payload) ? accumulateSaveData(def) : def;
        for (const payload of payloads) {
            steps.push(effectiveDef);
            transaction_history.push({ ...entry, payload });
        }
    }

    return { ...config, steps, transaction_history };
}

/**
 * Live session data accumulated over the WHOLE transaction history — main and
 * extra steps, with every retrigger applied. `APPEND#` saveData keys accumulate
 * across exploded retriggers natively.
 */
export async function getFullSession(
    config: MockPlaygroundConfigType
): Promise<Record<string, unknown>> {
    const linear = buildLinearConfig(config, true);
    return new MockRunner(linear).getSessionDataUpToStep(linear.transaction_history.length);
}

/**
 * Session data as seen by `actionId` — everything in history up to (but not
 * including) that step's first run. Falls back to the full session when the
 * step has not run yet.
 */
export async function getSessionUpToActionId(
    config: MockPlaygroundConfigType,
    actionId: string | undefined
): Promise<Record<string, unknown>> {
    const linear = buildLinearConfig(config, true);
    let index = linear.transaction_history.length;
    if (actionId) {
        const found = linear.transaction_history.findIndex((h) => h.action_id === actionId);
        if (found !== -1) index = found;
    }
    return new MockRunner(linear).getSessionDataUpToStep(index);
}
