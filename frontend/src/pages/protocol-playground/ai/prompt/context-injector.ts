import MockRunner, {
    ExecutionResult,
    MockPlaygroundConfigType,
    PlaygroundActionStep,
} from "@ondc/automation-mock-runner";

import { CONTEXT_TRUNCATION } from "../constants";

export interface RuntimeSnapshot {
    config: MockPlaygroundConfigType | undefined;
    activeApi: string | undefined;
    terminalTail: ExecutionResult[];
}

function truncate(value: string, maxChars: number): string {
    if (value.length <= maxChars) return value;
    return `${value.slice(0, maxChars)}\n… [truncated ${value.length - maxChars} chars]`;
}

function safeDecode(base64: string | undefined): string {
    if (!base64 || typeof base64 !== "string") return "";
    try {
        return MockRunner.decodeBase64(base64);
    } catch {
        return "";
    }
}

function summarizeStep(step: PlaygroundActionStep, index: number): string {
    const lines = [`#${index} ${step.action_id} (api=${step.api})`];
    if (step.owner) lines.push(`  owner: ${step.owner}`);
    if (step.description) lines.push(`  description: ${step.description}`);
    if (step.unsolicited) lines.push(`  unsolicited: true`);
    if (step.responseFor) lines.push(`  responseFor: ${step.responseFor}`);
    return lines.join("\n");
}

function activeStepBlock(step: PlaygroundActionStep): string {
    const generate = safeDecode(step.mock.generate);
    const validate = safeDecode(step.mock.validate);
    const requirements = safeDecode(step.mock.requirements);
    const defaultPayload = JSON.stringify(step.mock.defaultPayload ?? {}, null, 2);
    const inputs = JSON.stringify(step.mock.inputs ?? {}, null, 2);
    const formHtml = step.mock.formHtml ? safeDecode(step.mock.formHtml) : "";

    const sections = [
        `### generator.js\n\`\`\`js\n${truncate(generate, CONTEXT_TRUNCATION.stepCodeMaxChars / 4)}\n\`\`\``,
        `### validator.js\n\`\`\`js\n${truncate(validate, CONTEXT_TRUNCATION.stepCodeMaxChars / 4)}\n\`\`\``,
        `### requirements.js\n\`\`\`js\n${truncate(requirements, CONTEXT_TRUNCATION.stepCodeMaxChars / 4)}\n\`\`\``,
        `### defaultPayload.json\n\`\`\`json\n${truncate(defaultPayload, CONTEXT_TRUNCATION.stepCodeMaxChars / 8)}\n\`\`\``,
        `### inputs.json\n\`\`\`json\n${truncate(inputs, CONTEXT_TRUNCATION.stepCodeMaxChars / 8)}\n\`\`\``,
    ];
    if (formHtml) {
        sections.push(
            `### form.html\n\`\`\`html\n${truncate(formHtml, CONTEXT_TRUNCATION.stepCodeMaxChars / 8)}\n\`\`\``
        );
    }
    return sections.join("\n\n");
}

function terminalTailBlock(tail: ExecutionResult[]): string {
    if (tail.length === 0) return "_(no runs yet)_";
    return tail
        .map((entry, i) => {
            const text = JSON.stringify(entry, null, 2);
            return `#${i} ${truncate(text, CONTEXT_TRUNCATION.terminalLogMaxChars)}`;
        })
        .join("\n\n");
}

export function buildRuntimeContext(snapshot: RuntimeSnapshot): string {
    const { config, activeApi, terminalTail } = snapshot;
    if (!config) {
        return "## Runtime context\n\n_(no playground config loaded)_";
    }

    const meta = config.meta;
    const stepsSummary = config.steps.map(summarizeStep).join("\n");
    const activeStep = activeApi
        ? config.steps.find((s) => s.action_id === activeApi)
        : undefined;

    const helperLib = safeDecode(config.helperLib);
    const recentTerminal = terminalTail.slice(-CONTEXT_TRUNCATION.terminalTailCount);

    const parts: string[] = [];
    parts.push(`## Runtime context

### Flow meta
- domain: ${meta.domain}
- version: ${meta.version}
- flowId: ${meta.flowId}
- active step: ${activeApi ?? "_(none selected)_"}

### All steps
${stepsSummary}

### Helper library
\`\`\`js
${truncate(helperLib || "_(empty)_", CONTEXT_TRUNCATION.helperLibMaxChars)}
\`\`\`

### Recent terminal output
${terminalTailBlock(recentTerminal)}
`);

    if (activeStep) {
        parts.push(`### Active step details (${activeStep.action_id})
${activeStepBlock(activeStep)}`);
    }

    return parts.join("\n\n");
}
