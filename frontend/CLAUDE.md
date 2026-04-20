# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (binds to all interfaces via --host)
npm run build        # Type-check + Vite production build
npm run lint         # Run ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write (src/**/*.{ts,tsx,json,md})
npm run format:check # Prettier check only
npm run preview      # Preview production build
```

No test runner is configured.

## Environment Variables

```
VITE_BACKEND_URL                  # Main backend (default: http://localhost:4000)
VITE_BASE_URL                     # API service (default: http://localhost:3001/api-service)
VITE_ENVIRONMENT                  # "development" enables dev-only routes
VITE_DEVELOPER_GUIDE_BACKEND_URL  # Developer guide API
VITE_DB_SERVICE_API_KEY           # Database back-office API key
```

## Path Aliases

Always use aliases — never relative imports:

```
@/           → src/
@components  → src/components/
@pages       → src/pages/
@utils       → src/utils/
@hooks       → src/hooks/
@context     → src/context/
@services    → src/services/
@constants   → src/constants/
@types       → src/types/
@styles      → src/styles/
```

## Architecture

### Tech Stack

React 18 + TypeScript (strict) + Vite. UI: Ant Design (primary) + Tailwind CSS. Forms: React Hook Form for standard forms, `@rjsf` (react-jsonschema-form + ajv8) for schema-driven forms. Flow diagrams: `@xyflow/react`. Code editor: Monaco Editor. HTTP: Axios. Routing: React Router DOM v7.

### Directory Structure

```
src/
├── App.tsx              # Auth code exchange, UserContext + SessionContext providers
├── main.tsx             # Entry, BrowserRouter
├── components/
│   ├── Layout/          # Shell wrapping Header + Routes + Footer
│   ├── Routes/          # Explicit <Route> definitions
│   ├── Header/          # Nav; hooks extracted to Header/hooks/
│   ├── FlowShared/      # Reusable flow execution UI (pair-card, render-flows, etc.)
│   ├── PayloadEditor/   # Monaco-based JSON editor
│   ├── Chatbot/
│   └── ui/              # Atoms: forms/, mini-components/, SegmentedTabs/
├── pages/               # Route-level containers
├── context/
│   ├── context.tsx      # SessionContext — flow/session state
│   └── userContext.ts   # UserContext — auth state
├── services/
│   ├── apiClient.ts     # Axios instances + interceptors
│   ├── apiRoutes.ts     # All API_ROUTES constants
│   └── authService.ts
├── hooks/               # Custom hooks (useWorkbenchFlow, useDbBackOffice, etc.)
├── utils/
│   ├── request-utils.ts # triggerRequest, triggerSearch, fetchPayloads, getReport
│   ├── localStorageManager.ts
│   └── flow-utils.ts
├── types/               # Domain models: session-types, flow-types, flow-state-type
└── constants/
    └── routes.ts        # Route path constants
```

### State Management

Two React Contexts at root level — no Redux/Zustand:

- **UserContext** (`context/userContext.ts`): `isLoggedIn`, `userDetails`, `subscriberData`, `refreshUser()`. Populated after OAuth code exchange in `App.tsx`.
- **SessionContext** (`context/context.tsx`): `sessionId`, `activeFlowId`, `sessionData` (SessionCache), `requestData`, `responseData`, `selectedTab`, `metadata`, `sideView`. Drives all flow-testing UI.
- **GuideContext** (`context/guideContext.tsx`): Developer guide state.

### API Layer

Multiple Axios instances in `services/apiClient.ts`:
- `apiClient` — main backend; request interceptor injects Bearer token from localStorage.
- `developerGuideApiClient` / `developerGuideNotesApiClient` / `developerGuideCommentsApiClient` — separate backends for developer guide content.

All endpoint strings live in `API_ROUTES` (`services/apiRoutes.ts`). High-level flow helpers (`triggerRequest`, `triggerSearch`, `clearFlowData`, `fetchPayloads`, `getReport`) live in `utils/request-utils.ts` and update SessionContext.

### Auth Flow

`App.tsx` checks for `?code=` query param on load → calls `AuthService.exchangeCodeForToken()` → stores token via `authTokenManager` (localStorage) → calls `refreshUser()` to populate UserContext. Axios interceptor attaches token to every subsequent request. 401s trigger logout.

### Routing

Routes defined explicitly in `components/Routes/index.tsx`. Developer Guide routes (`/developer-guide/*`) are only rendered when `VITE_ENVIRONMENT === "development"`.

### Conventions

- **Prettier**: double quotes, semicolons, print width 100, tab width 4, trailing commas ES5.
- **ESLint**: `react-hooks/exhaustive-deps` is disabled; `@typescript-eslint/no-explicit-any` warns (not errors); `console.warn` and `console.error` are allowed.
- Components: PascalCase files. Utils/services: camelCase files.
- Hooks and types for a component live in subdirectories alongside it (e.g., `Header/hooks/`, `Header/types.ts`).
- Toast (`react-toastify`) for user-facing error/success messages; `console.error` for dev logging.
