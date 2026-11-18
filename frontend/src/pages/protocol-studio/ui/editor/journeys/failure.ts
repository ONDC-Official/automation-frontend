import type { RunFailureCauseV2 } from "@ondc/automation-mock-runner";

/**
 * What stopped a run, as the Flow preview and the live page head it, by the
 * rule the run broke (`cause` of the lib's failure). A failure stored before
 * causes existed has none.
 */
const FAILURE_TITLES: Record<RunFailureCauseV2, string> = {
    exit: "Exit condition never met",
    repeat: "Repeat limit reached",
    "no-wire": "The decision's case has no wire",
    requirements: "Requirements not met",
};

export const getFailureTitle = (cause?: RunFailureCauseV2) =>
    // Before causes existed, the only failure was an exit condition never met.
    cause ? FAILURE_TITLES[cause] : FAILURE_TITLES.exit;
