import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { StepGroup, getGroupSteps } from "./step-group";

type PlaygroundActionStep = MockPlaygroundConfigType["steps"][number];

/**
 * A group-specific validation rule. It inspects the *resulting* steps array of
 * a group and returns an error message, or `null` when the array is valid.
 *
 * Validating the resulting array (rather than the operation) keeps rules simple
 * and lets the same rule cover add / edit / import uniformly.
 */
export interface StepGroupRule {
    id: string;
    validate: (steps: PlaygroundActionStep[]) => string | null;
}

/** Extra steps cannot contain two steps with the same `api`. */
const uniqueApiRule: StepGroupRule = {
    id: "unique-api",
    validate: (steps) => {
        const seen = new Set<string>();
        for (const step of steps) {
            if (seen.has(step.api)) {
                return `Extra steps cannot contain duplicate API "${step.api}".`;
            }
            seen.add(step.api);
        }
        return null;
    },
};

/**
 * Per-group rule registry. To add a future rule: write a `StepGroupRule` above
 * and list it under the relevant group here — no other code needs to change.
 */
const STEP_GROUP_RULES: Record<StepGroup, StepGroupRule[]> = {
    main: [],
    extra: [uniqueApiRule],
};

/**
 * Validates one group's steps array against that group's rules.
 * Returns the first violation message, or `null` when valid.
 */
export function validateGroupSteps(
    group: StepGroup,
    steps: PlaygroundActionStep[]
): string | null {
    for (const rule of STEP_GROUP_RULES[group]) {
        const error = rule.validate(steps);
        if (error) return error;
    }
    return null;
}

/**
 * `action_id` must be unique across BOTH groups — the shared `transaction_history`
 * references steps by `action_id`, so a collision (within or across groups) is ambiguous.
 */
function validateActionIdUniqueness(config: MockPlaygroundConfigType): string | null {
    const seen = new Set<string>();
    for (const step of [...getGroupSteps(config, "main"), ...getGroupSteps(config, "extra")]) {
        if (seen.has(step.action_id)) {
            return `Duplicate action_id "${step.action_id}" — action ids must be unique across main and extra steps.`;
        }
        seen.add(step.action_id);
    }
    return null;
}

/**
 * Validates every group within a whole config — used at config entry points
 * (file import, GitHub import, gist load, Raw Config editor) and on add/edit.
 * Returns the first violation message, or `null` when valid.
 */
export function validateConfigGroups(config: MockPlaygroundConfigType): string | null {
    return (
        validateActionIdUniqueness(config) ??
        validateGroupSteps("main", getGroupSteps(config, "main")) ??
        validateGroupSteps("extra", getGroupSteps(config, "extra"))
    );
}
