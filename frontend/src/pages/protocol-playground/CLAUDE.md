# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Module Is

A browser-based ONDC protocol flow editor and test runner. Users compose a sequence of ONDC API actions (e.g. `search → on_search → select → …`), write JavaScript generators/validators per action in a Monaco editor, run steps one-by-one in-browser, track produced payloads, and export the result as JSON or a deployment YAML.

The entire mock execution happens **client-side** via the `@ondc/automation-mock-runner` npm package (`MockRunner`). No backend call is made when running steps — only when creating a live flow session (`createFlowSessionWithPlayground`).

---

## Entry Point & Page Routing

```
index.tsx               → PlaygroundContext provider + auto-save wiring
  └─ starter-page.tsx   → Domain/Version/FlowId picker (shown when no config loaded)
  └─ playground-page.tsx→ Main editor (shown once config is set), dev mode only
  └─ view-only-page.tsx → Read-only viewer when ?devMode=false
```

`index.tsx` also wires a `workbenchFlow` state machine (step 0 = playground, step 1 = `RenderFlows`), but `flowStepNum` never becomes 1 in practice — live sessions always open in a new tab via `window.open`. This code path is vestigial.

`currentState: "editing" | "running"` in the context is similarly vestigial — it is never toggled and nothing gates on it. Ignore it.

---

## Core Data Type

`MockPlaygroundConfigType` (from `@ondc/automation-mock-runner`) is the single source of truth. Its rough shape:

```ts
{
  meta: { domain, version, flowId },
  helperLib: string,           // Base64-encoded shared JS library
  steps: PlaygroundActionStep[],
  transaction_history: {
    action_id: string,
    action: string,
    payload: unknown,
    saved_info?: Record<string, string>  // alias → jsonpath (tentative)
  }[]
}

PlaygroundActionStep {
  action_id: string,
  api: string,                 // ONDC action name or "dynamic_form"/"html_form"
  description?: string,
  owner?: "BAP" | "BPP",
  unsolicited?: boolean,
  responseFor?: string,
  examples?: { name, payload, type, description }[],
  mock: {
    generate: string,          // Base64 JS
    validate: string,          // Base64 JS
    requirements: string,      // Base64 JS
    defaultPayload: object,
    inputs: { jsonSchema: JsonSchema },
    saveData: Record<string, string>,   // alias → jsonpath (persisted)
    formHtml?: string          // Base64 HTML (only for form steps)
  }
}
```

**Code fields are always Base64.** `updateStepMock` encodes on write; `MockRunner.decodeBase64` decodes on read. JSON fields (`defaultPayload`, `inputs`) are stored as parsed objects, not strings.

---

## State — PlaygroundContext

Defined in `context/playground-context.ts`, provided by `index.tsx`.

| Field | Purpose |
|---|---|
| `config` | The live `MockPlaygroundConfigType` |
| `setCurrentConfig(c)` | Updates state + auto-saves to localStorage |
| `activeApi` | `action_id` of the selected step in the timeline |
| `activeTerminalData` | Array of `ExecutionResult` from the mock runner |
| `useModal` | Shared modal: `openModal(jsx)` / `closeModal()` |
| `loading` | Global spinner flag |
| `updateStepMock(stepId, property, value)` | Edits one mock property; Base64-encodes JS/HTML |
| `updateTransactionHistory(actionId, action, payload, savedInfo?)` | Appends to `transaction_history` |
| `resetTransactionHistory(actionId?)` | Clears all history, or slices from `actionId` forward |
| `updateHelperLib(code)` | Base64-encodes and saves shared library |
| `loadSavedConfig / deleteSavedConfig / getSavedConfigs / loadConfigFromGist` | Config management |

---

## Persistence — Two-Layer localStorage

`utils/config-storage.ts` manages all persistence. No IndexedDB.

| Key | Contents |
|---|---|
| `"playgroundConfig"` | Current working config (raw JSON). Reloaded on page refresh. |
| `"playground_config_<id>"` | Named saved config. Key = `domain_version_flowId` (sanitized). |
| `"playground_configs_metadata"` | JSON array of `SavedConfigMetadata[]` — index for the browser. |

Gist-loaded configs use key prefix `"gist_<gistId>"`. Every `setCurrentConfig` call also triggers `saveConfig` (auto-save into the named slot).

URL param `?gist=<url or id>` on load → fetches gist, validates with `MockRunner.validateConfig()`, saves, sets as current.

---

## Step Execution Flow

```
runConfig()
  ├─ if api === "dynamic_form" | "html_form"
  │     → decode formHtml (Base64), open MockDynamicForm modal
  │     → on submit: updateTransactionHistory(actionId, api, formData)
  │
  ├─ if mock.inputs has no keys
  │     → executePayload({ actionId, action, inputs: {} })
  │
  └─ if mock.inputs has jsonSchema
        → open JsonSchemaForm modal
        → on submit: executePayload({ actionId, action, inputs: formData })

executePayload()
  → new MockRunner(config).runGeneratePayload(actionId, inputs)   // in-browser
  → appends ExecutionResult to activeTerminalData
  → on success: updateTransactionHistory(actionId, action, result.result)
```

`runCurrentConfig()` resets history then calls `runConfig()` in a loop until `activeApi` is reached.

`exportConfigForDeployment()` runs all steps, embeds each step's produced payload into `step.examples`, clears `transaction_history`, and downloads as YAML.

---

## Left Panel — Code Editor Tabs

Shown per selected action. Tab definitions live in `types/index.ts` as `PLAYGROUND_LEFT_TABS`.

| Tab file | Language | `mock` property | Notes |
|---|---|---|---|
| `generator.js` | JavaScript | `generate` | Main payload generator function |
| `validator.js` | JavaScript | `validate` | Validation logic |
| `requirements.js` | JavaScript | `requirements` | Pre-conditions check |
| `defaultPayload.json` | JSON | `defaultPayload` | Base payload |
| `inputs.json` | JSON | `inputs` | `{ jsonSchema: {...} }` — drives the input form |
| `form.html` | HTML | `formHtml` | Only shown for `dynamic_form`/`html_form` steps |

Monaco uses a custom dark sky-blue theme defined in `ui/editor-themes.tsx`.

---

## Right Panel — Five Tabs

| Tab id | Component | Purpose |
|---|---|---|
| `session` | `LeftSideView` (json tree) | Live accumulated session data with hover tooltips showing which action set each field |
| `transaction` | `SessionDataTab` | JSONPath manager — see below |
| `common_lib` | `CommonLibView` | Monaco editor for `helperLib` (shared JS available to all generators) |
| `output_payload` | `OutputPayloadViewer` | Payload for the active action + L1/L2 validation buttons |
| `terminal` | `Terminal` | `ExecutionResult` list: Result / Error / Logs / Validation sections |

---

## Session Manager Tab (`session-data-tab.tsx`)

This tab manages **saveData** — a mechanism for the mock runner to pull values from a prior step's payload into the next step's generator.

### Two tiers of path mappings

| Tier | Stored in | Lifecycle |
|---|---|---|
| **saveData** | `step.mock.saveData` (inside step config) | Persisted. Mock runner reads this to inject values. |
| **Tentative (saved_info)** | `transaction_history[n].saved_info` | Session-only. Promoted to `saveData` on "Save" button click. |

### Adding a mapping

- **Click a key/value** in the JSON tree → auto-generates alias `payload_<key>` → adds to `saved_info`
- **Add Manually** → type alias + JSONPath manually → saves directly to `step.mock.saveData`

### `EVAL#` prefix

A path value can start with `EVAL#` followed by a **Base64-encoded JS function**:
```
EVAL#<base64 of: function getSave(payload) { ...; return dataToSave; }>
```
Paths starting with `EVAL#` bypass JSONPath validation. The mock runner decodes and executes the function with the step's payload, using the return value as the saved data. Use this when the value to extract can't be expressed as a static JSONPath.

### Removing a saveData entry

Triggers a confirmation alert because it also calls `resetTransactionHistory()` — removing a persisted path invalidates downstream steps that may have depended on that value.

---

## Action Timeline (`ui/playground-upper/merged-sequcence.tsx`)

Horizontal strip of numbered circles. The "current" step is determined by `calcCurrentIndex(config)` from `mock-engine/index.ts`:

```ts
// Returns index of first step without a transaction_history entry
calcCurrentIndex(config) → number  (-1 if all done)
```

Each step circle supports: Add Before / Add After / Edit / Delete / Reset (clears history from that point).

Step types:
- **API step**: standard ONDC action from `ONDC_ACTION_LIST` (24 actions)
- **Form step**: `"dynamic_form"` or `"html_form"` — uses `formHtml` tab instead of JS tabs

---

## GitHub Gist Integration

`utils/fetch-gist.ts` fetches raw gist content via the GitHub API. Accepts:
- Full URL: `https://gist.github.com/user/id`
- Bare gist ID: `abc123def456`

The first file in the gist is used. Config is validated before being set. Gist configs are saved under `gist_<id>` key to avoid colliding with manually-saved configs.

---

## Key Files at a Glance

| File | Role |
|---|---|
| `index.tsx` | Context provider, localStorage boot, auto-save |
| `starter-page.tsx` | Domain/version/flow picker + saved configs modal |
| `playground-page.tsx` | Split-pane editor shell |
| `view-only-page.tsx` | Read-only mode (`?devMode=false`) |
| `context/playground-context.ts` | Context type definition |
| `hooks/use-config.tsx` | Export / import / run / deploy — all header button logic |
| `hooks/use-playground-actions.tsx` | CRUD for steps in the timeline |
| `ui/LeftSideView.tsx` | Monaco code editor + stats/validation badges |
| `ui/RightSideView.tsx` | Tab container for right panel |
| `ui/session-data-tab.tsx` | JSONPath saveData manager |
| `ui/playground-upper/merged-sequcence.tsx` | Action timeline |
| `ui/playground-upper/playground-header.tsx` | Header with all action buttons |
| `ui/extras/terminal.tsx` | Execution result viewer |
| `ui/extras/output-payload-viewer.tsx` | Payload + L1/L2 validation |
| `ui/components/mock-dynamic-form.tsx` | Renders Base64 HTML forms |
| `ui/extras/rsjf-form.tsx` | JSON Schema → React form |
| `utils/config-storage.ts` | localStorage CRUD for configs |
| `utils/fetch-gist.ts` | GitHub Gist fetcher |
| `utils/editor-utils.ts` | JSONPath from cursor position (hover tooltips) |
| `mock-engine/index.ts` | `calcCurrentIndex` — next step to run |
| `types/index.ts` | `ONDC_ACTION_LIST`, tab configs, type exports |
