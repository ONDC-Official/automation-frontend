import { MockRunner, MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
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

/**
 * Builds a config whose `steps` and `transaction_history` are positionally
 * aligned: every history entry (one per run, in execution order) is paired with
 * its step def. Extra steps that ran multiple times appear as multiple entries.
 *
 * The result is safe to feed to `new MockRunner(...)` — `getSessionDataUpToStep`
 * maps entry `i` to `steps[i]` positionally and treats each payload as one object.
 *
 * saveData is used exactly as authored, including for multi-run extra steps.
 */
export function buildLinearConfig(config: MockPlaygroundConfigType): MockPlaygroundConfigType {
    const steps: PlaygroundActionStep[] = [];
    const transaction_history: MockPlaygroundConfigType["transaction_history"] = [];

    for (const entry of config.transaction_history) {
        const def = findStepDef(config, entry.action_id);
        if (!def) continue;
        steps.push(def);
        transaction_history.push(entry);
    }

    return { ...config, steps, transaction_history };
}

/**
 * Live session data accumulated over the WHOLE transaction history — main and
 * extra steps, with every retrigger applied.
 */
export async function getFullSession(
    config: MockPlaygroundConfigType
): Promise<Record<string, unknown>> {
    const linear = buildLinearConfig(config);
    return new MockRunner(linear).getSessionDataUpToStep(linear.transaction_history.length);
}

/**
 * Session data a MAIN step would see when generated — mirrors
 * `MockRunner.runGeneratePayload`: the session is built from the first `index`
 * history entries, where `index` is the step's POSITION in `config.steps`.
 *
 * `getSessionDataUpToStep` THROWS when fewer steps have run than the step's
 * position requires, so selecting a step whose predecessors haven't run surfaces
 * an error (rendered by the caller) instead of a stale full session.
 */
export async function getSessionUpToActionId(
    config: MockPlaygroundConfigType,
    actionId: string | undefined
): Promise<Record<string, unknown>> {
    if (!actionId) return {};
    const index = config.steps.findIndex((s) => s.action_id === actionId);
    // Not a main step (extra steps go through getFullSession) — nothing to show.
    if (index < 0) return {};
    // Use a MAIN-ONLY history view: `index` is a position among main steps, so
    // the length check and positional alignment must ignore extra-step entries.
    // Otherwise extra runs inflate transaction_history.length and a main step
    // whose predecessors haven't run wrongly shows a session (and reads a
    // misaligned extra entry). Main steps run in order, so the filtered history
    // stays aligned with config.steps.
    const mainIds = new Set(config.steps.map((s) => s.action_id));
    const mainConfig = {
        ...config,
        transaction_history: config.transaction_history.filter((h) => mainIds.has(h.action_id)),
    };
    return new MockRunner(mainConfig).getSessionDataUpToStep(index);
}
