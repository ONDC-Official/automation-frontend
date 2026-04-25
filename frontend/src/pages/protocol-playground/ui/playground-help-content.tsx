// ─── Help content for PlaygroundHelpModal ────────────────────────────────────
// To add a new section: push a new entry to HELP_SECTIONS.
// To add a new FAQ:     push a new entry to FAQS.
// Both are exported so the modal can import and search them.

import { FaCode, FaDownload } from "react-icons/fa";
import { IoMdSkipForward } from "react-icons/io";
import { GrRedo } from "react-icons/gr";
import { TbAutomaticGearboxFilled, TbDatabaseExport } from "react-icons/tb";

export interface HelpSection {
    id: string;
    title: string;
    /** Plain-text keywords used by search (augments the title). */
    keywords?: string;
    content: React.ReactNode;
}

export interface Faq {
    q: string;
    a: React.ReactNode;
}

// ─── Shared UI primitives ────────────────────────────────────────────────────

export const Badge = ({
    children,
    color = "sky",
}: {
    children: React.ReactNode;
    color?: string;
}) => (
    <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold bg-${color}-100 text-${color}-700 border border-${color}-200`}
    >
        {children}
    </span>
);

export const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div className="flex gap-3 items-start">
        <span className="shrink-0 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
            {n}
        </span>
        <p className="text-gray-700 text-sm leading-relaxed">{children}</p>
    </div>
);

export const Callout = ({
    children,
    type = "info",
}: {
    children: React.ReactNode;
    type?: "info" | "warn" | "tip";
}) => {
    const styles = {
        info: "bg-sky-50 border-sky-300 text-sky-800",
        warn: "bg-amber-50 border-amber-300 text-amber-800",
        tip: "bg-emerald-50 border-emerald-300 text-emerald-800",
    };
    return (
        <div className={`rounded-lg border-l-4 px-4 py-3 text-sm ${styles[type]}`}>{children}</div>
    );
};

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2 first:mt-0">{children}</h3>
);

// ─── Sections ────────────────────────────────────────────────────────────────

export const HELP_SECTIONS: HelpSection[] = [
    {
        id: "overview",
        title: "Overview",
        keywords: "intro workflow how to start domain version flow gist",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    The <strong>Protocol Playground</strong> lets you design, run, and export ONDC
                    protocol flows entirely in your browser. You write JavaScript functions that
                    generate payloads for each API action, run them step-by-step, and watch the
                    session data build up in real time.
                </p>
                <Callout type="info">
                    All mock execution happens <strong>client-side</strong> — no backend call is
                    made when you run steps. The server is only contacted when you create a live
                    flow session.
                </Callout>
                <SectionTitle>Typical workflow</SectionTitle>
                <div className="space-y-2">
                    <Step n={1}>
                        Pick your <strong>Domain</strong>, <strong>Version</strong>, and{" "}
                        <strong>Flow ID</strong> on the starter page (or load a saved / Gist
                        config).
                    </Step>
                    <Step n={2}>
                        The <strong>Action Timeline</strong> at the top shows the sequence of ONDC
                        API calls. Add, reorder, or remove steps as needed.
                    </Step>
                    <Step n={3}>
                        Select a step — the <strong>left panel</strong> opens its code editor tabs.
                        Write your <Badge>generator.js</Badge> function to produce the payload.
                    </Step>
                    <Step n={4}>
                        Click <strong>Run Next Step</strong> to execute the current step. If the
                        step needs inputs, a form pops up automatically.
                    </Step>
                    <Step n={5}>
                        Watch the <strong>right panel</strong> — live session data, terminal logs,
                        and the output payload update after each run.
                    </Step>
                    <Step n={6}>
                        When done, <strong>export</strong> your config as JSON (to save and
                        re-import later) or as a <strong>deployment YAML</strong> (embeds all
                        generated example payloads).
                    </Step>
                </div>
            </div>
        ),
    },
    {
        id: "timeline",
        title: "Action Timeline",
        keywords:
            "steps add delete edit reset reorder BAP BPP checkmark form dynamic_form html_form",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    The horizontal strip at the top of the playground represents your flow. Each
                    circle is one action step. A <strong>checkmark</strong> means the step has
                    already been executed (has a payload in transaction history).
                </p>
                <SectionTitle>Step types</SectionTitle>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex gap-2 items-start">
                        <Badge color="sky">API step</Badge>
                        <span>
                            A standard ONDC action (search, on_search, select, confirm, …). Has JS
                            editor tabs.
                        </span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <Badge color="purple">Form step</Badge>
                        <span>
                            <Badge color="purple">dynamic_form</Badge> or{" "}
                            <Badge color="purple">html_form</Badge> — renders an HTML form instead
                            of running JS. The form data is stored as the step's payload.
                        </span>
                    </div>
                </div>
                <SectionTitle>Hover over a step to see controls</SectionTitle>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>
                        <strong>Add Before / After</strong> — insert a new step at that position
                    </li>
                    <li>
                        <strong>Edit</strong> — change owner (BAP/BPP), description, or responseFor
                    </li>
                    <li>
                        <strong>Delete</strong> — remove the step
                    </li>
                    <li>
                        <strong>Reset</strong> — clears transaction history from this step onward,
                        letting you re-run from here
                    </li>
                </ul>
                <Callout type="warn">
                    Resetting a step also clears all saveData-dependent downstream steps. If a later
                    step references a value from the reset step, it will need to be re-run too.
                </Callout>
            </div>
        ),
    },
    {
        id: "editor",
        title: "Code Editor (Left Panel)",
        keywords: "generator validator requirements inputs json schema base64 form.html tabs mock",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    Select any step in the timeline and the left panel shows its editor tabs. Each
                    tab corresponds to a field stored in the step's <code>mock</code> object. JS
                    code is stored as Base64 internally — you always edit plain text.
                </p>
                <SectionTitle>Tabs for API steps</SectionTitle>
                <div className="space-y-3 text-sm">
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge>generator.js</Badge>
                            <span className="text-gray-500 text-xs">most important</span>
                        </div>
                        <p className="text-gray-700">
                            A JavaScript function that <strong>returns the request payload</strong>{" "}
                            for this action. The mock-runner calls it with any resolved saveData
                            values as context. This is what gets sent / logged as the step's output.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge>validator.js</Badge>
                        <p className="text-gray-700 mt-1">
                            A function that validates the payload produced by the generator. Errors
                            appear in the Terminal tab under "Validation".
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge>requirements.js</Badge>
                        <p className="text-gray-700 mt-1">
                            Pre-condition checks that must pass before the generator runs.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="amber">defaultPayload.json</Badge>
                        <p className="text-gray-700 mt-1">
                            A base JSON object the generator can use as a starting template.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="amber">inputs.json</Badge>
                        <p className="text-gray-700 mt-1">
                            A JSON Schema (<code>{"{ jsonSchema: { ... } }"}</code>). When
                            non-empty, running this step opens a form so you can provide runtime
                            values that are passed into the generator.
                        </p>
                    </div>
                </div>
                <SectionTitle>For Form steps</SectionTitle>
                <div className="border border-gray-200 rounded-lg p-3 text-sm">
                    <Badge color="purple">form.html</Badge>
                    <p className="text-gray-700 mt-1">
                        Raw HTML for the form (stored as Base64). When you run a form step, this
                        HTML is rendered in a modal and the submitted values become the step's
                        payload.
                    </p>
                </div>
                <Callout type="tip">
                    The status bar below the editor shows live code statistics: lines, cyclomatic
                    complexity, loop count, and conditional count — useful for keeping generators
                    simple.
                </Callout>
            </div>
        ),
    },
    {
        id: "right-panel",
        title: "Right Panel Tabs",
        keywords: "live session data output payload terminal common helperLib L1 L2 validate logs",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    The right panel has five tabs. They update after every step execution.
                </p>
                <div className="space-y-3 text-sm">
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="sky">Live Session Data</Badge>
                        <p className="text-gray-700 mt-1">
                            The merged JSON object built from all executed step payloads so far.
                            Hover over any field to see which action last wrote it.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="sky">Session Manager</Badge>
                        <p className="text-gray-700 mt-1">
                            The JSONPath alias editor — lets you mark specific fields from a step's
                            payload so the next step's generator can reference them. See the{" "}
                            <em>Session Manager</em> section for full details.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="sky">Output Payload</Badge>
                        <p className="text-gray-700 mt-1">
                            The raw payload produced by the currently selected step. Includes{" "}
                            <strong>L1 Validate</strong> (ONDC protocol schema check) and{" "}
                            <strong>L2 Validate</strong> (mock-runner validation) buttons.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="gray">Terminal</Badge>
                        <p className="text-gray-700 mt-1">
                            Execution logs from the last run: result summary, any JS errors, console
                            output from inside your generator, and validation results.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <Badge color="emerald">Common</Badge>
                        <p className="text-gray-700 mt-1">
                            A shared JavaScript library (the <code>helperLib</code>) available to
                            every generator in the flow. Define utility functions here once and use
                            them anywhere.
                        </p>
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: "session-manager",
        title: "Session Manager",
        keywords:
            "saveData alias JSONPath EVAL# APPEND# MORE_SEQUENCE mapping tentative getSave expand flow",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    The Session Manager tab lets you extract values from a completed step's payload
                    and give them <strong>aliases</strong>. The mock-runner injects these aliased
                    values into the next step's generator as context variables, letting steps pass
                    data to each other.
                </p>

                <SectionTitle>How to add a mapping</SectionTitle>
                <div className="space-y-2">
                    <Step n={1}>
                        In the <strong>left half</strong>, browse the JSON tree of the step's
                        payload.
                    </Step>
                    <Step n={2}>
                        Click any key or primitive value — a <Badge>payload_&lt;key&gt;</Badge>{" "}
                        alias is auto-created and appears as <strong>Tentative Save Data</strong> on
                        the right.
                    </Step>
                    <Step n={3}>
                        Review and rename the alias if needed, then click <strong>Save</strong> to
                        promote it to persistent <strong>Save Data</strong>.
                    </Step>
                </div>
                <p className="text-gray-700 text-sm">
                    You can also click <strong>Add Manually</strong> and type a JSONPath (e.g.{" "}
                    <code>$.context.city</code>) directly.
                </p>

                <SectionTitle>Two tiers of mappings</SectionTitle>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex gap-2 items-start">
                        <Badge color="sky">Save Data</Badge>
                        <span>
                            Persisted inside the step config. The mock-runner always reads these
                            when running the next step.
                        </span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <Badge color="gray">Tentative</Badge>
                        <span>
                            Session-only. Lost if you reset. Promote to Save Data using the Save
                            button.
                        </span>
                    </div>
                </div>

                <SectionTitle>Alias prefixes</SectionTitle>
                <p className="text-gray-700 text-sm mb-3">
                    Both the <strong>alias (key)</strong> and the <strong>path (value)</strong>{" "}
                    support special prefixes that change extraction behaviour.
                </p>

                <div className="space-y-4">
                    {/* EVAL# */}
                    <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/40">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge color="amber">EVAL#</Badge>
                            <span className="text-xs text-gray-500 font-medium">on the path</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                            Use when a static JSONPath can't express what you need to extract. The
                            value after <code>EVAL#</code> is a{" "}
                            <strong>Base64-encoded JS function</strong>. The mock-runner decodes and
                            calls it with the step's payload, using the return value as the saved
                            data.
                        </p>
                        <pre className="bg-gray-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto">
                            {`// Write the function, then Base64-encode it\nfunction getSave(payload) {\n  return payload.message.order.items[0].id;\n}\n\n// Store the alias path as:\n// EVAL#<base64 of the function above>`}
                        </pre>
                    </div>

                    {/* APPEND# */}
                    <div className="border border-violet-200 rounded-lg p-4 bg-violet-50/40">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge color="purple">APPEND#</Badge>
                            <span className="text-xs text-gray-500 font-medium">on the alias</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                            Use when you want to{" "}
                            <strong>collect values from multiple steps into a single array</strong>{" "}
                            instead of overwriting. Prefix the alias with <code>APPEND#</code>; the
                            real key name is everything after the prefix.
                        </p>
                        <pre className="bg-gray-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto">
                            {`// Step 1 saveData:\n"APPEND#itemIds": "$.message.order.items[*].id"\n// → sessionData.itemIds = ["id-a", "id-b"]\n\n// Step 2 saveData (same alias):\n"APPEND#itemIds": "$.message.order.items[*].id"\n// → sessionData.itemIds = ["id-a", "id-b", "id-c", "id-d"]`}
                        </pre>
                        <p className="text-gray-700 text-sm mt-2">
                            Can be combined with <Badge color="amber">EVAL#</Badge> on the path
                            side: <code>{"APPEND#myKey → EVAL#<base64fn>"}</code>
                        </p>
                    </div>

                    {/* MORE_SEQUENCE */}
                    <div className="border border-rose-200 rounded-lg p-4 bg-rose-50/40">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge color="red">MORE_SEQUENCE</Badge>
                            <span className="text-xs text-gray-500 font-medium">
                                special return key from EVAL#
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                            A <code>getSave</code> function can{" "}
                            <strong>dynamically expand the flow at runtime</strong> by returning an
                            object with a <code>MORE_SEQUENCE</code> key. The mock-runner reads the
                            array and appends those steps to the flow before continuing execution —
                            no manual timeline editing needed.
                        </p>
                        <pre className="bg-gray-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto">
                            {`function getSave(payload) {\n  const needsUpdate = payload.message.order.state === "In-progress";\n\n  if (needsUpdate) {\n    return {\n      MORE_SEQUENCE: [\n        // key MUST be "GENERATED#<n>#<existing_action_id>"\n        // The action_id at the end must already exist in the current flow.\n        // The runner reuses that step's mock code as the template.\n        { key: "GENERATED#1#on_update", type: "on_update", unsolicited: false,\n          pair: null, owner: "BPP", expect: false },\n        { key: "GENERATED#2#status",    type: "status",    unsolicited: false,\n          pair: "on_status", owner: "BAP", expect: false },\n      ]\n    };\n  }\n\n  // Return normal data if no expansion needed\n  return { orderId: payload.message.order.id };\n}`}
                        </pre>
                        <div className="mt-3 space-y-1 text-sm text-gray-700">
                            <p className="font-medium">Each entry in MORE_SEQUENCE needs:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                <li>
                                    <code>key</code> — <strong>must follow the pattern</strong>{" "}
                                    <Badge color="red">GENERATED#&lt;n&gt;#&lt;action_id&gt;</Badge>
                                    . The <code>&lt;action_id&gt;</code> at the end{" "}
                                    <strong>must be an action_id that already exists</strong> in the
                                    current flow. The runner clones that step's mock code
                                    (generator, validator, saveData, etc.) as the template for the
                                    new step. <code>&lt;n&gt;</code> is an incrementing number to
                                    keep keys unique when the same base action is generated multiple
                                    times (e.g. <code>GENERATED#1#on_update</code>,{" "}
                                    <code>GENERATED#2#on_update</code>).
                                </li>
                                <li>
                                    <code>type</code> — ONDC action name (e.g.{" "}
                                    <code>on_update</code>)
                                </li>
                                <li>
                                    <code>unsolicited</code> — boolean, whether this is an
                                    unsolicited call
                                </li>
                                <li>
                                    <code>pair</code> — the paired response action, or{" "}
                                    <code>null</code>
                                </li>
                                <li>
                                    <code>owner</code> — <code>"BAP"</code> or <code>"BPP"</code>
                                </li>
                                <li>
                                    <code>expect</code> — boolean, whether a response is expected
                                </li>
                            </ul>
                        </div>
                        <Callout type="info">
                            <code>MORE_SEQUENCE</code> is evaluated during session data compilation
                            (before each step runs), so the expansion is visible in the timeline
                            before the new steps execute.
                        </Callout>
                    </div>
                </div>

                <Callout type="warn">
                    Deleting a Save Data alias resets the transaction history from that step onward
                    — downstream steps that depended on the alias need to be re-run.
                </Callout>
            </div>
        ),
    },
    {
        id: "running",
        title: "Running Steps",
        keywords: "run next step up to current reset execute error fail",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    There are two run buttons in the header:
                </p>
                <div className="space-y-3 text-sm">
                    <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                        <div className="flex items-center gap-2 mb-1 text-orange-700 font-semibold">
                            <IoMdSkipForward size={14} /> Run Next Step
                        </div>
                        <p className="text-gray-700">
                            Executes the <strong>next unexecuted step</strong> in the timeline (the
                            first one without a checkmark). If the step has an{" "}
                            <Badge color="amber">inputs.json</Badge> schema, a form pops up first.
                        </p>
                    </div>
                    <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                        <div className="flex items-center gap-2 mb-1 text-green-700 font-semibold">
                            <GrRedo size={14} /> Run Up To Current
                        </div>
                        <p className="text-gray-700">
                            Resets transaction history, then runs every step in order up to and
                            including the <strong>currently selected step</strong>. Useful for
                            re-generating the full sequence with new logic.
                        </p>
                    </div>
                </div>
                <Callout type="info">
                    If a step fails mid-sequence, execution stops and an error toast tells you which
                    action_id failed. Fix the generator and re-run.
                </Callout>
                <SectionTitle>Resetting a step</SectionTitle>
                <p className="text-gray-700 text-sm">
                    Hover over any step in the timeline and click <strong>Reset</strong> to clear
                    its transaction history entry and all entries after it, allowing you to re-run
                    from that point.
                </p>
            </div>
        ),
    },
    {
        id: "export-import",
        title: "Export & Import",
        keywords: "download upload yaml json gist share deploy deployment checkpoint",
        content: (
            <div className="space-y-4">
                <div className="space-y-3 text-sm">
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1 font-semibold text-gray-800">
                            <FaDownload size={12} /> Download (JSON)
                        </div>
                        <p className="text-gray-700">
                            Exports the current config as a <code>.json</code> file. Includes your
                            code, step definitions, and transaction history. Use this to save your
                            work and re-import it later.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1 font-semibold text-gray-800">
                            <TbDatabaseExport size={14} /> Export for Deployment (YAML)
                        </div>
                        <p className="text-gray-700">
                            Runs all steps from scratch, embeds the generated payloads as{" "}
                            <code>examples</code> in each step, clears transaction history, and
                            downloads a <code>.yaml</code> file ready for deployment. You will be
                            prompted to fill any input forms during this process.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1 font-semibold text-gray-800">
                            <FaCode size={12} /> Upload (Import JSON)
                        </div>
                        <p className="text-gray-700">
                            Load a previously downloaded <code>.json</code> config file. The config
                            is validated before being applied.
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1 font-semibold text-gray-800">
                            GitHub Gist
                        </div>
                        <p className="text-gray-700">
                            Share a config by pasting the Gist URL as a query param:{" "}
                            <code>?gist=https://gist.github.com/…</code>. The playground fetches,
                            validates, and saves it automatically. Configs loaded via Gist are saved
                            under a <code>gist_</code> prefix to avoid overwriting local saves.
                        </p>
                    </div>
                </div>
                <Callout type="tip">
                    The playground auto-saves your config to localStorage on every change. Your work
                    survives page refreshes. Use <strong>Download</strong> for explicit checkpoints
                    or to share with teammates.
                </Callout>
            </div>
        ),
    },
    {
        id: "live-session",
        title: "Live Flow Session",
        keywords: "subscriber URL BAP BPP live test real endpoint create session testing",
        content: (
            <div className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                    The <strong>Create Live Session</strong> button (
                    <TbAutomaticGearboxFilled className="inline" size={14} />) lets you test your
                    flow against a real subscriber endpoint.
                </p>
                <div className="space-y-2">
                    <Step n={1}>
                        Click <strong>Create Live Session</strong> in the header.
                    </Step>
                    <Step n={2}>
                        Enter your <strong>Subscriber URL</strong> and your role (<Badge>BAP</Badge>{" "}
                        or <Badge>BPP</Badge>).
                    </Step>
                    <Step n={3}>
                        The playground creates a session on the backend and opens the{" "}
                        <strong>Flow Testing</strong> page in a new tab with that session.
                    </Step>
                </div>
                <Callout type="tip">
                    Enter <code>testing</code> as the subscriber URL to automatically open two
                    sessions — one for BAP and one for BPP — using the environment's default
                    endpoints.
                </Callout>
            </div>
        ),
    },
];

// ─── FAQs ────────────────────────────────────────────────────────────────────

export const FAQS: Faq[] = [
    {
        q: "My generator runs but the payload looks wrong — where do I check?",
        a: (
            <p>
                Open the <Badge color="gray">Terminal</Badge> tab on the right panel. It shows the
                full execution result, any JS errors thrown inside your function, console.log
                output, and validation errors. The <Badge color="sky">Output Payload</Badge> tab
                shows the raw payload the generator returned.
            </p>
        ),
    },
    {
        q: "How does saveData pass values between steps?",
        a: (
            <p>
                In the <Badge color="sky">Session Manager</Badge> tab, you map a JSONPath (like{" "}
                <code>$.context.transaction_id</code>) from step N's payload to an alias (like{" "}
                <code>txnId</code>). When step N+1 runs, the mock-runner resolves all saveData
                aliases and makes them available inside the generator function as context variables.
            </p>
        ),
    },
    {
        q: "What is the EVAL# prefix in saveData?",
        a: (
            <p>
                Use <code>EVAL#</code> when a static JSONPath isn't expressive enough. Write a JS
                function <code>{"function getSave(payload) { return ...; }"}</code>, Base64-encode
                it, and store <code>{"EVAL#<base64>"}</code> as the path. The mock-runner calls your
                function with the step payload and uses the return value.
            </p>
        ),
    },
    {
        q: "How do I collect values from multiple steps into one array?",
        a: (
            <p>
                Prefix the alias with <Badge color="purple">APPEND#</Badge> — e.g.{" "}
                <code>APPEND#itemIds</code>. Instead of replacing the existing{" "}
                <code>sessionData.itemIds</code>, the mock-runner concatenates the newly extracted
                values onto it. Use the same <code>APPEND#itemIds</code> alias in every step that
                contributes to the array.
            </p>
        ),
    },
    {
        q: "Can a step add new steps to the flow at runtime?",
        a: (
            <div className="space-y-2 text-sm text-gray-700">
                <p>
                    Yes — using <Badge color="red">MORE_SEQUENCE</Badge>. In a <code>getSave</code>{" "}
                    function (via <Badge color="amber">EVAL#</Badge>), return{" "}
                    <code>{"{ MORE_SEQUENCE: [...] }"}</code>. Each entry describes a new step to
                    insert.
                </p>
                <p>
                    The <code>key</code> of every entry <strong>must</strong> follow the format{" "}
                    <code>GENERATED#&lt;n&gt;#&lt;action_id&gt;</code> where <code>action_id</code>{" "}
                    is an action that <strong>already exists</strong> in the current flow. The
                    runner clones that existing step's mock code as the template for the new
                    dynamically-inserted step. Use the incrementing <code>&lt;n&gt;</code> to keep
                    keys unique when the same base action is generated more than once.
                </p>
            </div>
        ),
    },
    {
        q: "Can I undo removing a Save Data alias?",
        a: (
            <p>
                Not directly. Removing a Save Data alias also resets transaction history from that
                step onward. Re-run the affected steps to regenerate their payloads. To avoid
                accidental loss, export a JSON checkpoint before making structural changes.
            </p>
        ),
    },
    {
        q: "What is the Common Library (helperLib)?",
        a: (
            <p>
                The <Badge color="emerald">Common</Badge> tab contains shared JavaScript available
                to every generator and validator in the flow. Define helper functions (date
                formatters, UUID generators, etc.) here once and call them from any step's code.
            </p>
        ),
    },
    {
        q: "How do I share my config with a teammate?",
        a: (
            <p>
                Use <strong>Download</strong> to export a <code>.json</code> file and send it — they
                can use <strong>Upload</strong> to load it. Alternatively, paste the config into a
                GitHub Gist and share the URL; opening <code>?gist=&lt;gist-url&gt;</code> loads it
                automatically.
            </p>
        ),
    },
    {
        q: "What's the difference between Download and Export for Deployment?",
        a: (
            <p>
                <strong>Download</strong> saves the config exactly as-is (including your JS code and
                transaction history) — meant for saving your work.{" "}
                <strong>Export for Deployment</strong> runs all steps, embeds the generated payloads
                as <code>examples</code>, strips transaction history, and outputs YAML — meant as a
                deployment artifact.
            </p>
        ),
    },
    {
        q: "DataCloneError: #<Promise> could not be cloned when my generate returns.",
        a: (
            <p>
                Your <code>generate</code> is returning a payload that contains an un-awaited
                Promise. Make <code>generate</code> <code>async</code> and <code>await</code> any
                helper that returns a Promise (e.g. <code>generateConsentHandler</code>). Only the
                top-level return is auto-awaited — nested Promises <strong>inside</strong> the
                payload are NOT.
            </p>
        ),
    },
    {
        q: "fetch blocked: <url> is not in the configured allowlist.",
        a: (
            <p>
                Outbound HTTP is gated. The installing service must allowlist origins at boot:{" "}
                <code>
                    {
                        'MockRunner.initSharedRunner({ allowedFetchBaseUrls: ["https://finvu.example.com"] })'
                    }
                </code>
                . The origin must match exactly; the path is a strict segment-prefix —{" "}
                <code>/v1</code> matches <code>/v1</code> and <code>/v1/foo</code> but not{" "}
                <code>/v10</code>.
            </p>
        ),
    },
    {
        q: "fetch is not defined inside validate / meetsRequirements.",
        a: (
            <p>
                By design — only <code>generate</code> gets <code>fetch</code>. Do HTTP there, stash
                the result via saveData, and read it in later steps.
            </p>
        ),
    },
    {
        q: "AbortController is not defined.",
        a: (
            <p>
                <code>AbortController</code> is available in the sandbox. If you still hit this
                error you're on an older build — regen helpers (<code>npm run helpers:gen</code>)
                and rebuild the library.
            </p>
        ),
    },
    {
        q: "My helper references sessionData but gets ReferenceError: sessionData is not defined.",
        a: (
            <p>
                <code>sessionData</code> is a parameter of <code>generate</code>, not visible at
                helper scope. Take it as an explicit first argument:{" "}
                <code>function myHelper(sessionData, ...)</code>. This is the pattern used by{" "}
                <code>getSubscriberUrl</code>, <code>createFormURL</code>, and{" "}
                <code>generateConsentHandler</code>.
            </p>
        ),
    },
    {
        q: "I edited default-helpers.js but the bundle didn't change.",
        a: (
            <p>
                Run <code>npm run helpers:gen</code> (or <code>npm test</code> /{" "}
                <code>npm run build</code> — they regen automatically). The string constant in{" "}
                <code>default-helpers-source.ts</code> is what gets shipped; the <code>.js</code>{" "}
                file is just the author's editable view.
            </p>
        ),
    },
    {
        q: "Can I use require / import inside a helper?",
        a: (
            <p>
                No. The sandbox has no module system. Only whitelisted globals are available:{" "}
                <code>Math</code>, <code>Date</code>, <code>JSON</code>, <code>Promise</code>,{" "}
                <code>AbortController</code>, <code>fetch</code>, <code>URL</code>, and sibling
                helpers.
            </p>
        ),
    },
    {
        q: "Can I use arrow functions / const declarations for helpers?",
        a: (
            <p>
                They work, but <strong>function declarations are preferred</strong> — they hoist, so
                cross-helper calls work regardless of definition order.
            </p>
        ),
    },
    {
        q: "Execution timed out — what are the limits?",
        a: (
            <p>
                Per-function caps: <code>generate</code> 45 s, <code>validate</code> 5 s,{" "}
                <code>meetsRequirements</code> 3 s, <code>getSave</code> 3 s.{" "}
                <code>setTimeout</code> inside the sandbox is clamped to 45 000 ms max.
            </p>
        ),
    },
    {
        q: "My fetch call followed a 3xx redirect and failed.",
        a: (
            <p>
                Intentional — the scoped fetch uses <code>redirect: "error"</code> to prevent
                redirect-based allowlist bypass. Call the final URL directly.
            </p>
        ),
    },
    {
        q: "How do I pass request-scope values (like finvuUrl) into helpers?",
        a: (
            <p>
                Use the third argument of{" "}
                <code>runGeneratePayload(actionId, inputs, extraSessionData)</code> /{" "}
                <code>runValidatePayload(actionId, payload, extraSessionData)</code>. It is
                shallow-merged into the built <code>sessionData</code> before execution, so your
                helpers can read it via the <code>sessionData</code> parameter.
            </p>
        ),
    },
    {
        q: "How do I add a Finvu verification form step?",
        a: (
            <div className="space-y-3 text-sm text-gray-700">
                <p>
                    For any action step where you want to open the Finvu verification form, set its{" "}
                    <Badge color="amber">inputs.json</Badge> to the following — the mock-runner
                    detects the <code>finvu_verification</code> id and renders the Finvu flow
                    instead of a generic form:
                </p>
                <pre className="bg-gray-900 text-emerald-400 text-xs rounded-lg p-3 overflow-x-auto">
                    {`{\n  "id": "finvu_verification",\n  "jsonSchema": {}\n}`}
                </pre>
                <p>
                    In any <strong>prior step's</strong> generator, call{" "}
                    <code>generateConsentHandler</code> to produce the consent data that the Finvu
                    form needs. Save the result via saveData so it is available in{" "}
                    <code>sessionData</code> when the form step runs.
                </p>
                <p>
                    To change the Finvu URL (e.g. point at a different environment), open the{" "}
                    <strong>raw config editor</strong> and edit the{" "}
                    <code>external_session_data</code> field — that is where the Finvu base URL is
                    stored and read from at runtime.
                </p>
            </div>
        ),
    },
];
