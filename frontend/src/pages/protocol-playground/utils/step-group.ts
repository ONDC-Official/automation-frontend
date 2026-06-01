import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

export type StepGroup = "main" | "extra";

type PlaygroundActionStep = MockPlaygroundConfigType["steps"][number];

/**
 * Returns the steps array for the given group.
 * For the "extra" group this is `config.extra_steps.steps` ([] if absent).
 */
export function getGroupSteps(
    config: MockPlaygroundConfigType | undefined,
    group: StepGroup
): PlaygroundActionStep[] {
    if (!config) return [];
    if (group === "extra") return config.extra_steps?.steps ?? [];
    return config.steps;
}

/**
 * Returns a NEW config with the given group's steps array replaced.
 */
export function setGroupSteps(
    config: MockPlaygroundConfigType,
    group: StepGroup,
    steps: PlaygroundActionStep[]
): MockPlaygroundConfigType {
    if (group === "extra") {
        return { ...config, extra_steps: { ...config.extra_steps, steps } };
    }
    return { ...config, steps };
}

/**
 * Returns a config VIEW whose `.steps` is the group's steps array.
 * Feed this to `new MockRunner(...)` and `calcCurrentIndex(...)`, both of
 * which only read `.steps`, so they transparently operate on the group.
 */
export function configForGroup(
    config: MockPlaygroundConfigType,
    group: StepGroup
): MockPlaygroundConfigType {
    if (group === "extra") {
        return { ...config, steps: getGroupSteps(config, "extra") };
    }
    return config;
}
