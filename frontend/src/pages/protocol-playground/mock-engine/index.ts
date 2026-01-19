import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

export function calcCurrentIndex(config: MockPlaygroundConfigType) {
    const history = config.transaction_history;
    const steps = config.steps;
    for (const step of steps) {
        const found = history.find((h) => h.action_id === step.action_id);
        if (!found) {
            return steps.indexOf(step);
        }
    }
    return steps.length;
}
