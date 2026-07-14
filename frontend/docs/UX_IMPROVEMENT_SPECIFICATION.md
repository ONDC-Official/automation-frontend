# UX Improvement Specification — automation-frontend

**Date:** 2026-07-13 (rescoped for release, two rescoping passes)
**Scope:** Every user-facing route in the app — global navigation/layout, Home, Support, Scenario, Flow Testing, Schema Validation, Seller Onboarding, Protocol Playground, Developer Guide, Seller Load Testing, User Profile (+History/Auth Header), DB Back Office, Framework Health.
**Method:** Each page/area was read end-to-end (component tree, hooks, Redux/RTK Query state) and walked as a real desktop user would. Every finding below is backed by an exact file/line reference; several of the most severe (marked ⚠️) were independently re-verified against the current `main-tech` branch before inclusion.
**Release scope note (final pass):** This document has been through two rescoping passes beyond the original audit:

1. Removed anything requiring a new feature, backend change, or product decision (new search, keyboard shortcuts, calendar/ICS, JSON-viewer capability additions, navigation restructuring, etc.).
2. **This pass** applies the strictest bar: **every remaining item must be implementable by modifying existing UI behaviour only.** Concretely disallowed and scrubbed from every item below: new buttons, new actions, new navigation paths, new dialogs (unless replacing an existing destructive action with an existing confirmation component), new banners, new pages/empty states, new retry affordances (unless a retry control already exists in the UI and is only being exposed), new persistent indicators/badges, new editor capabilities, status handling that requires backend/API-layer changes, new validation workflows, and auto-navigation (e.g. auto-switching tabs). Where an item's core problem was real but its fix introduced any of the above, it was either rewritten to a pure wording/timing/state-reuse fix or removed entirely. Toast notifications via the app's existing `sonner` toast mechanism are treated as "existing UI behaviour" throughout (they are the app's standing, transient notification pattern, used at dozens of call sites already) — adding a new `toast.error`/`toast.success` call is allowed; adding a new persistent banner, panel, or badge is not.

Original numbering (UX-001...) is preserved as-is, including gaps where items were removed in either pass, so this document stays diffable against the original audit.

**Out of scope:** redesigns, color/typography/spacing/animation, component-library swaps, mobile/responsive layout, new features, backend changes, content/navigation restructuring, product decisions, new UI elements of any kind.

Legend — Complexity: Low / Medium / High. Priority: Critical / High / Medium / Low.

---

## Table of Contents

1. [Global Navigation, Layout & Auth](#1-global-navigation-layout--auth)
2. [Home](#2-home)
3. [Support](#3-support)
4. [Scenario & Flow Testing (shared DomainFlowRunner engine)](#4-scenario--flow-testing)
5. [Schema Validation](#5-schema-validation)
6. [Seller Onboarding](#6-seller-onboarding)
7. [Protocol Playground](#7-protocol-playground)
8. [Developer Guide](#8-developer-guide)
9. [Seller Load Testing](#9-seller-load-testing)
10. [User Profile](#10-user-profile)
11. [History](#11-history)
12. [Auth Header](#12-auth-header)
13. [DB Back Office](#13-db-back-office)
14. [Framework Health](#14-framework-health)
15. [Summary Table](#15-summary-table)

---

## 1. Global Navigation, Layout & Auth

### UX-001 — Environment banner always renders; Layout's padding math assumes it doesn't, clipping page content ⚠️

**Page:** All pages (global Header/Layout) **Route:** All routes

**User Journey:** Every page load, on any deployment.

**Current Behaviour:** `src/components/Header/index.tsx:15-26` used to gate the orange "`{env}` ENVIRONMENT — NOT A PRODUCTION RELEASE" banner behind `isDev`, but the gate is now commented out:

```tsx
const env = import.meta.env.VITE_ENVIRONMENT;
// const isDev = import.meta.env.VITE_ENVIRONMENT === "development";
...
{/* {isDev && ( */}
<div className="flex h-8 items-center justify-center bg-[#F5A623]">
    <span>{env} ENVIRONMENT — NOT A PRODUCTION RELEASE</span>
</div>
{/* )} */}
```

so the 32px banner renders in every environment. Separately, `src/components/Layout/index.tsx:6,13` computes its own `isDev` and only reserves the extra top padding (`pt-24` vs `pt-16`) when `isDev` is true.

**Problem:** In staging/production, the fixed header is really 96px tall (32px banner + 64px nav) but `Layout` only reserves 64px of top padding — the top ~32px of every page's content renders underneath the fixed header, unreadable/unclickable.

**Root Cause:** The banner's conditional render was commented out without updating `Layout`'s independently-computed padding logic.

**Implementation**

- **Primary Files:** `src/components/Header/index.tsx:15-26`, `src/components/Layout/index.tsx:6,13`
- **Relevant Components:** `Header`, `Layout`

**Required Changes:** Restore the gating in `Header` — uncomment `isDev` and wrap the banner div in `{isDev && (...)}` so it matches `Layout`'s existing `isDev` check.

**Acceptance Criteria:** In a `VITE_ENVIRONMENT=production` build, the banner does not render and no page content is clipped under the header. In `development`, the banner renders as before.

**Complexity:** Low **Priority:** Critical

---

### UX-002 — OAuth login failures are completely silent

**Page:** Global (Header login / any page reached via `/?code=...` OAuth callback) **Route:** All

**User Journey:** User clicks "Login with GitHub", authorizes on GitHub, is redirected back with `?code=`.

**Current Behaviour:** `src/store/api/developerGuide/endpoints/auth/auth.api.ts`'s `exchangeCode` failure path only does `console.error(...)` (`:63-66`) and `getMe`'s failure path silently logs the user out (`:41-43`) — neither shows a `toast.error`, while the success path already shows `toast.success("Login Successfull!")` (`:37`, existing typo).

**Problem:** A user whose OAuth exchange fails sees the `LoadingOverlay` vanish and lands back on Home as if nothing happened — no explanation.

**Root Cause:** `catch` blocks log to console only; no `toast.error` call exists anywhere in the auth flow, despite the `sonner` `toast` already being imported in this exact file for the success case.

**Implementation**

- **Primary Files:** `src/store/api/developerGuide/endpoints/auth/auth.api.ts:41-43,62-66`

**Required Changes:** In the existing `catch` blocks of `exchangeCode`'s and `getMe`'s `onQueryStarted`, add `toast.error("We couldn't sign you in. Please try again.")` using the same `toast` import already used for the success message. Fix the "Successfull" typo while touching this file.

**Acceptance Criteria:** A failed `exchangeCode`/`getMe` call shows a visible error toast before the user lands back on Home.

**Complexity:** Low **Priority:** High

---

### UX-004 — Footer external links open in the same tab, unlike identical links elsewhere in the app

**Page:** Global Footer **Route:** All pages

**User Journey:** Clicking "About ONDC," "API Documentation," "Bug Reports," "Join ONDC," or the LinkedIn/GitHub icons in the footer.

**Current Behaviour:** `src/components/Footer/FooterLinkItem.tsx:15-21` and `FooterSocialLinks.tsx:7-13` render every (fully external) link as a plain `<a href=...>` with no `target`/`rel`. `src/pages/home/PathCardLinks.tsx:16-24` already uses `target="_blank" rel="noopener noreferrer"` for equivalent external links elsewhere in the app.

**Problem:** Footer links navigate the current tab away from the tool entirely, unlike identical external links elsewhere.

**Root Cause:** `FooterLinkItem`/`FooterSocialLinks` never adopted the `target="_blank"` attribute already used on equivalent links elsewhere.

**Implementation**

- **Primary Files:** `src/components/Footer/FooterLinkItem.tsx:15-21`, `src/components/Footer/FooterSocialLinks.tsx:7-13`

**Required Changes:** Add `target="_blank" rel="noopener noreferrer"` to the anchors in both files.

**Acceptance Criteria:** Every footer link/icon opens in a new tab.

**Complexity:** Low **Priority:** Medium

---

## 2. Home

### UX-005 — "Start Building" CTA gives zero click feedback while the login redirect is in flight _(rewritten for release scope)_

**Page:** Home **Route:** `/`

**User Journey:** A logged-out visitor clicks the primary "Start Building" hero CTA.

**Current Behaviour:** `src/pages/home/HeroInfo.tsx:11-19`'s `handleStartBuilding` sets `window.location.href` for a logged-out user with no intermediate state change on the button itself.

**Problem:** The button gives no disabled/pending state on click; if the redirect takes a moment, users may click repeatedly with no feedback.

**Root Cause:** No local pending state is tracked around the click handler.

**Implementation**

- **Primary Files:** `src/pages/home/HeroInfo.tsx:11-19`

**Required Changes:** Add a local `isRedirecting` state set to `true` on click, and use it to disable the button (and show its existing loading/spinner treatment, if the `Button` component already supports one) for the brief window before the browser completes the redirect. Do not change the redirect mechanism itself.

**Acceptance Criteria:** Clicking "Start Building" immediately disables the button so a second click can't fire before the redirect completes.

**Complexity:** Low **Priority:** High

---

### UX-007 — "Pick your path" card hover implies the whole card is clickable; only the footer text links work

**Page:** Home **Route:** `/`

**User Journey:** Hovering over a "Pick your path" card's title/description.

**Current Behaviour:** `src/pages/home/PickYourPath.tsx:28` wraps title, description, and links in `<Card variant="interactive">`, whose hover styling (`Shadcn/Card/card.tsx:13-14`) applies to the whole card body — but `Card` has no `onClick`/`role`; only the small arrow links in `CardFooter` actually navigate.

**Problem:** Hovering the title/description visually signals "clickable," but clicking there does nothing.

**Root Cause:** `variant="interactive"` hover styling scoped to the whole card, not just the real interactive elements.

**Implementation**

- **Primary Files:** `src/pages/home/PickYourPath.tsx:28-46`

**Required Changes:** Drop `variant="interactive"` from the outer `Card` and move the hover affordance onto `PathCardLinks`'s anchors only.

**Acceptance Criteria:** Hover feedback appears only over genuinely clickable link text, not the whole card body.

**Complexity:** Low **Priority:** Medium

---

## 3. Support

No low-risk items identified for this release (both original findings required new capabilities and were removed in the prior rescoping pass).

---

## 4. Scenario & Flow Testing

_(Both pages render the shared `src/components/DomainFlowRunner/**` engine; findings that stem from that shared component are marked as such and apply to both routes.)_

### UX-010 — Session-creation/open-in-new-tab can be silently blocked by the browser's popup blocker _(rewritten for release scope)_

**Page:** Scenario **Route:** `/scenario`

**User Journey:** Submitting the "New Session" form, or clicking "Open" on a history card.

**Current Behaviour:** `createAndOpenSession` (`src/pages/scenario/index.tsx:79-110`) calls `window.open(newTabUrl, "_blank")` only _after_ `await createSession(...).unwrap()` — no longer synchronous with the click, so most browsers block it as a popup. Neither this nor `openSessionInNewTab` (`helpers.ts:4-11`) checks `window.open`'s return value (`null` when blocked).

**Problem:** If the popup is blocked, the user clicks Submit/Open and nothing visibly happens.

**Root Cause:** No check of `window.open`'s return value.

**Implementation**

- **Primary Files:** `src/pages/scenario/index.tsx:79-110`, `src/pages/scenario/helpers.ts:4-11`

**Required Changes:** Check `window.open`'s return value; when `null`, show a `toast.error` informing the user their browser blocked the popup and that they should allow popups for this site and try again.

**Acceptance Criteria:** With popups blocked, submitting/opening a session shows a visible toast instead of silently doing nothing.

**Complexity:** Low **Priority:** High

---

### UX-011 — "Session has expired" dialog asserts expiry as fact for what may be a transient network error (shared `DomainFlowRunner` component) _(rewritten for release scope)_

**Page:** Scenario & Flow Testing **Route:** `/scenario`, `/flow-testing`

**User Journey:** Mid flow-test, the session poll fails repeatedly.

**Current Behaviour:** After 5 consecutive poll failures, an existing modal (`RenderFlows/index.tsx:395-416`) states "Session has expired... Check support to raise a query," whose only existing action closes the dialog via `navigate(ROUTES.HOME)`.

**Problem:** ~25 seconds of failed polls is just as likely to be a transient network/backend blip as a genuine expiry, but the copy asserts expiry as fact.

**Root Cause:** The dialog's existing copy overstates certainty for what is really "we lost contact with the server."

**Implementation**

- **Primary Files:** `src/components/DomainFlowRunner/RenderFlows/index.tsx:395-416`

**Required Changes:** Reword the existing dialog's message to reflect "we couldn't reach the server" rather than asserting expiry. Keep the dialog's single existing action (close → navigate home) unchanged.

**Acceptance Criteria:** The dialog's copy no longer states expiry as certain fact.

**Complexity:** Low **Priority:** Medium

---

### UX-012 — "View Report" click can fail with zero feedback and no duplicate-click guard

**Page:** Scenario **Route:** `/scenario` (report view within `RenderFlows`)

**User Journey:** Clicking "View Report" after a flow completes.

**Current Behaviour:** `RenderFlows/index.tsx:496-514` — `const response = await triggerGetReport({ sessionId }).unwrap();` has no surrounding try/catch, and the button has no loading/disabled state.

**Problem:** If the request rejects, the rejection is unhandled — no toast, no visual change. The user can also click repeatedly while the first request is in flight.

**Root Cause:** Missing error handling around the async call; no busy-state gating.

**Implementation**

- **Primary Files:** `src/components/DomainFlowRunner/RenderFlows/index.tsx:496-514`

**Required Changes:** Wrap the handler in try/catch with `toast.error(...)` on failure; add a local `isLoading` state disabling the button during the fetch.

**Acceptance Criteria:** A failed report fetch shows an error toast; the button is disabled until the request settles.

**Complexity:** Low **Priority:** High

---

### UX-013 — Flow action buttons (Start/Stop/Clear) have no busy state, allowing duplicate submissions

**Page:** Scenario & Flow Testing **Route:** `/scenario`, `/flow-testing`

**User Journey:** Clicking "Start flow," "Stop flow," or "Clear flow data" repeatedly before the first request resolves.

**Current Behaviour:** `FlowActionButton`'s `disabled` prop (`FlowActionButton/index.tsx:9-14`) is only driven by static conditions, never by an in-flight flag for the underlying async mutations called from `AccordionButtons` (`FlowRunAccordion/index.tsx:318-408`).

**Problem:** Rapid repeat clicks before the first call resolves can fire duplicate requests against the backend.

**Root Cause:** No per-action loading flag gates `disabled`.

**Implementation**

- **Primary Files:** `src/components/DomainFlowRunner/FlowRunAccordion/index.tsx:318-408`

**Required Changes:** Add a local `isBusy` state set for the duration of each action's async handler and pass it into the existing `FlowActionButton`'s `disabled` prop.

**Acceptance Criteria:** Clicking Start/Stop/Clear twice in quick succession only fires one request per action.

**Complexity:** Low-Medium **Priority:** High

---

### UX-014 — New Session form validates only on submit; ComboBox fields don't receive the same auto-focus-on-error behaviour standard inputs already get

**Page:** Scenario **Route:** `/scenario`

**User Journey:** Filling the New Session form.

**Current Behaviour:** `useNewSessionForm`'s `useForm(...)` (`hooks/useNewSessionForm.ts:38`) sets no `mode`, so react-hook-form defaults to `onSubmit`. Separately, `ComboBox` (`src/components/Shadcn/ComboBox/index.tsx:46-62`) never forwards `field.ref` from its `Controller`, so RHF's default `shouldFocusError` behaviour — which already works for the form's plain `Input` fields — has nothing to focus for the 5 ComboBox fields.

**Problem:** Errors surface only after Submit, and on failure standard fields get focused automatically while ComboBox fields (the same form) do not — an inconsistency within the same form, not a new capability being introduced.

**Root Cause:** No `mode: "onBlur"` configured; missing ref plumbing in the custom `ComboBox` breaks a default RHF behaviour already active elsewhere on this exact form.

**Implementation**

- **Primary Files:** `src/pages/scenario/hooks/useNewSessionForm.ts:38`, `src/components/Shadcn/ComboBox/index.tsx:46-62`

**Required Changes:** Set `mode: "onBlur"` in the existing `useForm` config. Forward `field.ref` to `ComboboxInput`'s underlying input element so react-hook-form's already-active default focus-on-error behaviour applies to ComboBox fields the same way it already applies to plain inputs on this form.

**Acceptance Criteria:** Field errors appear on blur; a failed submit focuses the first invalid field consistently across both input types on this form.

**Complexity:** Low-Medium **Priority:** Medium

---

### UX-015 — Flow Testing's "No Flows Found" message is shown for a fetch failure exactly the same as for a genuinely empty session _(rewritten for release scope)_

**Page:** Flow Testing **Route:** `/flow-testing`

**User Journey:** Opening a `/flow-testing?...` link whose session fetch fails.

**Current Behaviour:** `fetchSessionData` (`src/pages/flow-testing/index.tsx:20-37`) catches all errors with only `toast.error("Failed to load session data")`; the existing render logic (`:74-83`) then always shows the same static "No Flows Found — No flow configurations found for this session" message, regardless of whether the cause was a real empty session or a fetch error.

**Problem:** A transient network failure is reported with the exact same wording as "your session genuinely has no flows."

**Root Cause:** The existing empty-state message doesn't distinguish its two possible causes.

**Implementation**

- **Primary Files:** `src/pages/flow-testing/index.tsx:20-83`

**Required Changes:** Track whether the last fetch attempt errored (a local boolean is already implicitly needed for the existing toast to fire) and, when true, change the existing empty-state message's wording to something that doesn't assert "no flows" as fact (e.g. "We couldn't load this session's flow data"), reusing the same render location and styling already used for the "No Flows Found" message today.

**Acceptance Criteria:** A failed fetch shows different wording in the existing empty-state slot than a genuinely empty session.

**Complexity:** Low **Priority:** Medium

---

## 5. Schema Validation

### UX-017 — Generic "Something went wrong" on any validation-request failure _(rewritten for release scope)_

**Page:** Schema Validation **Route:** `/schema-validation`

**User Journey:** Clicking "Validate" when the backend call fails.

**Current Behaviour:** `useSchemaValidation.ts:179-184` catches any failure and always shows the same message, `"Something went wrong"` (`constants.ts:130`).

**Problem:** No indication of whether the payload is fine and the backend is down vs. a real error.

**Root Cause:** Single catch-all error code for every failure type.

**Implementation**

- **Primary Files:** `src/pages/schema-validation/hooks/useSchemaValidation.ts:179-184`, `src/pages/schema-validation/constants.ts:130`

**Required Changes:** Differentiate the existing error message text for a network/connection failure vs. a server error, using whatever distinction is already available on the caught error object. Do not add a new retry control — the existing "Validate" button already lets the user retry.

**Acceptance Criteria:** A network failure and a server error show distinguishable message text.

**Complexity:** Low **Priority:** Medium

---

### UX-018 — Client-side pre-checks read the same as real backend schema errors _(rewritten for release scope)_

**Page:** Schema Validation **Route:** `/schema-validation`

**User Journey:** Validating with a valid JSON payload but an inactive domain/version selection, or a missing action.

**Current Behaviour:** `verifyRequest` (`useSchemaValidation.ts:129-185`) runs client-only checks before ever calling the backend, and funnels them into the same `ValidationErrorsPanel` UI used for real backend schema errors. `DOMAIN_NOT_ACTIVE`'s existing message text says "visit home page."

**Problem:** A user with valid JSON but a config issue sees wording that reads the same as a real schema violation.

**Root Cause:** The existing message text for `MISSING_ACTION`/`DOMAIN_NOT_ACTIVE` doesn't make clear this is a configuration issue rather than a payload defect.

**Implementation**

- **Primary Files:** `src/pages/schema-validation/utils/helpers.ts:347-416`

**Required Changes:** Reword the existing `MISSING_ACTION`/`DOMAIN_NOT_ACTIVE` message strings to state plainly that this is a domain/version selection issue, not a payload error (e.g. "Select an active domain and version before validating" instead of implying a schema failure). No change to how or where the message is rendered.

**Acceptance Criteria:** The existing message text for these two cases no longer reads like a schema validation failure.

**Complexity:** Low **Priority:** Low

---

### UX-019 — Whitespace-only payload bypasses the "empty payload" guard

**Page:** Schema Validation **Route:** `/schema-validation`

**User Journey:** Pasting/typing only whitespace into the payload editor.

**Current Behaviour:** The Validate button's `disabled={isLoading || payload === ""}` (`index.tsx:49`) and `parsePayload`'s empty-check (`utils/helpers.ts:313-339`) both do an exact-string comparison, not a trimmed one.

**Problem:** Whitespace-only input enables the button, then produces the generic "Invalid payload" message instead of the existing, more accurate "Add payload for the request" message meant for the empty case.

**Root Cause:** Emptiness check doesn't `.trim()` before comparing.

**Implementation**

- **Primary Files:** `src/pages/schema-validation/index.tsx:49`, `src/pages/schema-validation/utils/helpers.ts:313-339`

**Required Changes:** Use `payload.trim() === ""` for both the button's `disabled` condition and `parsePayload`'s empty-check.

**Acceptance Criteria:** Whitespace-only input shows the existing "Add payload for the request" message, not "Invalid payload."

**Complexity:** Low **Priority:** Low

---

## 6. Seller Onboarding

### UX-021 — Item Details submit shows "success" before the real API call resolves, allowing duplicate submission ⚠️

**Page:** Seller Onboarding **Route:** `/seller-onboarding` (Item Details step → final submit)

**User Journey:** Clicking "Next"/"Submit" on the final onboarding step.

**Current Behaviour:** `item-details-form.tsx`'s `onSubmit` calls `onNext(finalData)` **without `await`**, then immediately calls `toast.success("Item details saved successfully!")`. `onNext` is `SellerOnboarding.handleSubmit` (`index.tsx:314-340`) — an async function performing the real `sellerOnSearch` mutation. The button's `isLoading={isSubmitting}` reflects only RHF's own near-instant submit state, not the network call.

**Problem:** The button re-enables before the real API call finishes, so a user can click again and fire a duplicate submission. If the real call later fails, the user has already seen a success toast and then sees a contradicting error toast moments later.

**Root Cause:** `onNext` is treated as fire-and-forget inside the child form component.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/item-details-form.tsx` (`onSubmit`), `src/pages/seller-onboarding/index.tsx:314-340`

**Required Changes:** Make `onSubmit` `async`, `await onNext(finalData)`, remove the premature `toast.success` in `item-details-form.tsx` (the real success toast already fires in `index.tsx:321` on actual API success), and keep the button disabled for the full duration of the network call.

**Acceptance Criteria:** The Next/Submit button stays disabled until the real API call resolves; only one success or error toast is shown, matching the actual outcome.

**Complexity:** Low **Priority:** Critical

---

### UX-023 — Destructive deletes (variant, store, menu item, customization group) have no confirmation

**Page:** Seller Onboarding **Route:** `/seller-onboarding`

**User Journey:** Clicking the trash icon on a variant, store tab, menu item, or customization group.

**Current Behaviour:** `removeVariant` (`item-details-form.tsx:506-511`), `removeStore` (`business-verification-form-multiple.tsx:458-470`), `removeMenuItem` and `handleRemoveCustomizationGroup` (`custom-menu-form-enhanced.tsx:487-491,564-568`) all mutate state immediately with no confirm step.

**Problem:** One misclick permanently discards nested data (timings, serviceabilities, customization groups) with no undo.

**Root Cause:** No confirm-dialog pattern applied to any of these list/array-remove actions, even though the app's own `Dialog`/`AlertDialog` components are already used elsewhere in these same files for variant editing.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/item-details-form.tsx:506-511,2610-2634`, `src/pages/seller-onboarding/business-verification-form-multiple.tsx:458-470,1192-1204`, `src/pages/seller-onboarding/custom-menu-form-enhanced.tsx:487-491,564-568`

**Required Changes:** Wrap each removal in a confirmation dialog, reusing the same `Dialog`/`AlertDialog` component already used elsewhere in these files, before calling `remove()`/the state mutation.

**Acceptance Criteria:** Every listed delete action requires an explicit confirm step, using the app's existing dialog component, before the item is removed.

**Complexity:** Low **Priority:** High

---

### UX-025 — "Back to Dashboard" on the success screen destroys the generated payload with no confirmation _(rewritten for release scope)_

**Page:** Seller Onboarding **Route:** `/seller-onboarding` (success screen)

**User Journey:** Viewing the generated `on_search` payload after completing onboarding, then clicking "Back to Dashboard."

**Current Behaviour:** `onboarding-success-payload.tsx:233-235` wires `onBack` directly to `SellerOnboarding.handleRestart` (`index.tsx:306-312`), which instantly wipes the generated payload with no confirmation — the payload's only persistence is Copy/Download.

**Problem:** Clicking "Back to Dashboard" before copying/downloading the payload destroys it permanently with no recovery.

**Root Cause:** `handleRestart` is unconditionally bound to a plain button click.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/onboarding-success-payload.tsx:232-235`, `src/pages/seller-onboarding/index.tsx:306-312`

**Required Changes:** Add a confirmation step before `handleRestart` runs, reusing the app's existing confirmation dialog component (the same pattern already used for other destructive actions in this flow).

**Acceptance Criteria:** Clicking "Back to Dashboard" prompts a confirmation before the payload is discarded.

**Complexity:** Low **Priority:** Medium

---

### UX-026 — Variant/menu modals discard in-progress edits on Escape/backdrop click with no warning

**Page:** Seller Onboarding **Route:** `/seller-onboarding` (Item Details — Create/Edit Variant modals)

**User Journey:** Partially editing variant attributes, then pressing Escape or clicking outside the dialog.

**Current Behaviour:** The Create Variants dialog (`item-details-form.tsx:2696-2711`) and Edit Variant dialog (`:2902-2904`) both clear all locally-typed values unconditionally on close, regardless of trigger — Escape, backdrop click, or the Cancel button all currently discard with zero confirmation.

**Problem:** Escape or an accidental backdrop click silently discards in-progress variant edits.

**Root Cause:** `onOpenChange` calls the same reset/cancel handler with no dirty-check.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/item-details-form.tsx:678-687,2696-2711,2902-2904`

**Required Changes:** Track a (non-displayed) dirty flag for the modal's local state; if dirty, show a confirm step before closing, using the same dialog component already used elsewhere in this file for delete confirmations.

**Acceptance Criteria:** Closing the modal with unsaved edits via Escape/backdrop click prompts a confirmation; closing a clean/unedited modal does not.

**Complexity:** Low-Medium **Priority:** Medium

---

### UX-027 — Native `alert()` used once instead of the app's toast convention

**Page:** Seller Onboarding **Route:** `/seller-onboarding` (Custom Menu step)

**User Journey:** A menu-item submission error occurs while filling the F&B custom menu.

**Current Behaviour:** `custom-menu-form-enhanced.tsx`'s `onSubmit` catch block (`:615-619`) uses a raw `alert(...)`, while every other error path in the same file uses `toast.error(...)`.

**Problem:** A jarring, blocking native dialog appears inconsistently with the rest of the app's feedback style.

**Root Cause:** One-off `alert()` left in instead of the shared toast pattern already used elsewhere in the same file.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/custom-menu-form-enhanced.tsx:615-620`

**Required Changes:** Replace with `toast.error(...)`, matching the rest of the form.

**Acceptance Criteria:** The menu-submit error path shows a toast, not a native `alert`.

**Complexity:** Low **Priority:** Low

---

### UX-029 — Changing Domain or Store silently clears Category and optional attributes with no warning

**Page:** Seller Onboarding **Route:** `/seller-onboarding` (Item Details step)

**User Journey:** Filling category-specific attributes, then changing Domain or Store to correct an earlier mistake.

**Current Behaviour:** Domain's `onValueChange` (`item-details-form.tsx:893-907`) and Store's `onValueChange` (`:1308-1314`) both reset Category and optional attributes with no toast — inconsistent with the sibling serviceability-type change, which already warns via `toast.info(...)` (`business-verification-form-multiple.tsx:1531-1534`).

**Problem:** Users lose visibility into already-filled category-specific work with zero notice.

**Root Cause:** The cascading-reset logic omitted the warning toast a sibling feature already implements.

**Implementation**

- **Primary Files:** `src/pages/seller-onboarding/item-details-form.tsx:893-907,1308-1314`

**Required Changes:** Add `toast.info("Category and attribute selections were reset because Domain/Store changed")` alongside the resets, matching the existing precedent already used elsewhere in the same form.

**Acceptance Criteria:** Changing Domain/Store after filling category attributes shows a toast explaining the reset.

**Complexity:** Low **Priority:** Low

---

## 7. Protocol Playground

_(Route `/playground`. Findings below are limited to error-visibility and confirmation consistency fixes; anything requiring a new editor capability, new panel, or new persistent indicator was removed from scope.)_

### UX-030 — Invalid JSON typed into `defaultPayload.json`/`inputs.json` is silently discarded — no error, nothing ⚠️ _(rewritten for release scope)_

**Page:** Protocol Playground **Route:** `/playground`

**User Journey:** Editing a step's `defaultPayload.json` or `inputs.json` tab in the left code editor.

**Current Behaviour:** Editing debounces 150ms then calls `updateStepMock(stepId, property, value)`. On a `JSON.parse` failure:

```ts
// src/pages/protocol-playground/index.tsx:139-146
try {
    value = JSON.parse(value);
} catch (e) {
    console.error("Invalid JSON value:", e);
    return;
}
```

the function returns early — the step's stored value simply isn't updated, with zero UI feedback.

**Problem:** A JSON tab silently stops saving the moment it becomes invalid, with no toast, banner, or other indicator.

**Root Cause:** `updateStepMock` swallows the `JSON.parse` failure with only a `console.error`.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/index.tsx:129-161`
- **Supporting Files:** `src/pages/protocol-playground/ui/LeftSideView.tsx:97-122` (`handleEditorChange`)

**Required Changes:** Have `updateStepMock` return `{ ok: boolean }` instead of `void`; have `LeftSideView.handleEditorChange` show a `toast.error("Invalid JSON — not saved for <tab>")` when it returns `ok: false`.

**Acceptance Criteria:** Typing invalid JSON into either tab shows a toast indicating the edit wasn't saved.

**Complexity:** Low **Priority:** Critical

---

### UX-031 — Timeline "Reset" wipes forward transaction history with no confirmation, unlike an identical action elsewhere

**Page:** Protocol Playground **Route:** `/playground`

**User Journey:** Clicking "Reset" on a step in the action timeline hover card.

**Current Behaviour:** `action-details-card.tsx:120-124` wires "Reset" directly to `resetTransactionHistory(action.id)`, which truncates `transaction_history` from that action forward. The Session Data tab performs the _identical_ call when removing a `saveData` entry, and for that reason already confirms first via the app's existing `DeleteConfirmationForm` (`session-data-tab/index.tsx:396-423`). The "Delete" button on the same card also already goes through that same confirmation.

**Problem:** A misclick on "Reset" discards all downstream execution results with no undo, while the identical action elsewhere in the app already requires confirmation.

**Root Cause:** `action-details-card.tsx` wires "Reset" straight to the context method instead of through the existing confirmation-modal pattern already used for the same underlying call.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/ui/playground-upper/action-details-card.tsx:120-124`
- **Supporting Files:** `src/pages/protocol-playground/hooks/use-modal.tsx:135-159,202-217` (existing `DeleteConfirmationForm`)

**Required Changes:** Route "Reset" through the same `openModal(<DeleteConfirmationForm ... />)` pattern already used for step deletion and saveData removal.

**Acceptance Criteria:** Clicking "Reset" opens the existing confirmation dialog before any transaction history is cleared.

**Complexity:** Low **Priority:** High

---

### UX-036 — Import/GitHub-import/raw-editor validation errors are flattened into one comma-joined string inside an existing banner

**Page:** Protocol Playground **Route:** `/playground`

**User Journey:** Importing a config (file or GitHub) or editing the raw config, when validation fails with multiple errors.

**Current Behaviour:** Every validation-failure path formats the same way, e.g. `toast.error(\`Invalid configuration: ${validConfig.errors?.join(", ")}\`)`, and the GitHub-import modal's existing error banner (`:219-223`) and the raw-editor's existing banner (`:55-59`) both render this same joined string.

**Problem:** With more than one or two errors, the existing banner becomes an unreadable run-on sentence.

**Root Cause:** The already-available `errors` array is joined into a string instead of rendered as a list, inside the banner element that already exists at each site.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/hooks/use-config-io.tsx:47-66`, `src/pages/protocol-playground/ui/github-import-modal.tsx:109-128`, `src/pages/protocol-playground/playground-page.tsx:170-196`

**Required Changes:** In the existing banner elements at each site, render `validConfig.errors` as a list instead of a joined string. Keep the existing `toast.error` short.

**Acceptance Criteria:** A multi-error validation failure shows each error on its own line inside the existing banner.

**Complexity:** Low **Priority:** Medium

---

### UX-037 — Session Data manager fails silently (console.warn only) on duplicate alias/path

**Page:** Protocol Playground **Route:** `/playground` (Session Data tab)

**User Journey:** Renaming a saved-data alias to one that already exists, or adding a path already saved under another alias.

**Current Behaviour:** Two branches log only `console.warn(...)` and return, while a few lines away in the same file, the JSONPath-format failure already sets visible component state via `setError("Invalid JSONPath format")`.

**Problem:** Clicking Save/Add just silently no-ops with no visible reason, unless devtools are open — inconsistent with the sibling error path in the same component.

**Root Cause:** Two branches use `console.warn` instead of the `error`/`setError` state already used and already rendered elsewhere in the same component.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/ui/session-data-tab/index.tsx:256-300,332-377`

**Required Changes:** Route both `console.warn` branches through the same existing `setError` state used for the JSONPath-format case.

**Acceptance Criteria:** Attempting a duplicate alias/path shows the same visible inline error already used for the sibling case.

**Complexity:** Low **Priority:** Medium

---

### UX-040 — Saved-config deletion uses the browser's native `window.confirm()` instead of the app's existing dialog

**Page:** Protocol Playground **Route:** `/playground` (Saved Configs modal)

**User Journey:** Deleting a saved config from the Saved Configs list.

**Current Behaviour:** `saved-configs-modal.tsx:295-300` uses `window.confirm(...)`, while every other destructive confirmation in the Playground (step delete, clear-all, saveData removal) already uses the app's own styled `DeleteConfirmationForm`/`Dialog` components.

**Problem:** A native browser confirm looks/behaves differently from the rest of the app's confirmations for the identical kind of action.

**Root Cause:** This one call site never adopted the app's existing dialog pattern already used for equivalent actions.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/ui/saved-configs-modal.tsx:295-300`
- **Supporting Files:** `src/pages/protocol-playground/ui/from-contents.tsx:122-145` (existing `DeleteConfirmationForm`)

**Required Changes:** Replace `window.confirm` with the same `DeleteConfirmationForm` dialog already used for step deletion and clear-all.

**Acceptance Criteria:** Deleting a saved config opens the app's existing styled confirmation dialog, not a native browser confirm.

**Complexity:** Low **Priority:** Low-Medium

---

### UX-041 — Autosave failures are swallowed with no toast at all _(rewritten for release scope)_

**Page:** Protocol Playground **Route:** `/playground`

**User Journey:** Any config change while working in the Playground (autosave to Redux-Persist/localStorage).

**Current Behaviour:** `saveConfig` (`config-storage.ts:69-97`) returns `false` on failure, but both call sites discard the return value; a failure is only a `console.error`.

**Problem:** The Playground's persistence promise is "your work survives a refresh." If the write silently fails, the user only discovers it isn't saved after refreshing and losing work.

**Root Cause:** `saveConfig`'s boolean return value is ignored by every caller.

**Implementation**

- **Primary Files:** `src/pages/protocol-playground/utils/config-storage.ts:69-97`, `src/pages/protocol-playground/index.tsx:96-103,338-342`

**Required Changes:** Check `saveConfig`'s return value at both autosave call sites; on `false`, show `toast.error("Auto-save failed — your latest changes may not survive a refresh")` using the app's standard toast pattern.

**Acceptance Criteria:** Simulating a `localStorage` write failure surfaces a toast instead of only a console log.

**Complexity:** Low **Priority:** Medium

---

## 8. Developer Guide

_(Dev-only feature, `VITE_ENVIRONMENT === "development"`.)_

### UX-043 — Doc fetch failure message tells the user to "try again" with no way to do so _(rewritten for release scope)_

**Page:** Developer Guide — Docs **Route:** `/developer-guide/docs/:slug`

**User Journey:** Opening a GitHub-sourced doc that fails to load.

**Current Behaviour:** `DeveloperGuideDocContent.tsx:60-68` shows `<p>Failed to load documentation. Please try again.</p>` with no action available.

**Problem:** The existing copy instructs the user to "try again" but the only way to do so is a full page reload, which the message doesn't say.

**Root Cause:** Message wording implies an in-place retry action that doesn't exist.

**Implementation**

- **Primary Files:** `src/pages/developer-guide/layout/DeveloperGuideDocContent.tsx:60-68`

**Required Changes:** Reword the existing message to accurately describe the only current recovery path, e.g. "Failed to load documentation. Refresh the page to try again." No new button.

**Acceptance Criteria:** The error message no longer implies an action that doesn't exist.

**Complexity:** Low **Priority:** Medium

---

### UX-047 — "Use case not found" is shown for any fetch error, not just genuinely missing use cases _(rewritten for release scope)_

**Page:** Developer Guide — Use-case flow page **Route:** `/developer-guide/:domain/:version/:useCase`

**User Journey:** A transient network/backend error occurs while loading a use case's spec.

**Current Behaviour:** `useSpecData.ts:58`: `const notFound = specError;` — true for _any_ failed request. `DeveloperGuideFlowPage/index.tsx:54-72` then shows "Use case not found for this domain/version" with the existing "Back to Developer Guide" button.

**Problem:** A transient hiccup is asserted as "this use case doesn't exist," which may not be true.

**Root Cause:** The existing message text asserts non-existence for any error, not just a genuine 404.

**Implementation**

- **Primary Files:** `src/pages/developer-guide/DeveloperGuideFlowPage/index.tsx:54-72`

**Required Changes:** Soften the existing message's wording so it doesn't assert non-existence as fact for any failure (e.g. "This use case couldn't be loaded" instead of "not found"). Keep the existing single "Back to Developer Guide" button unchanged.

**Acceptance Criteria:** The message no longer overstates certainty about the use case not existing.

**Complexity:** Low **Priority:** Medium

---

### UX-048 — Expanding/collapsing a schema tree row silently resets pagination to page 1

**Page:** Developer Guide — Use-case flow page, Request/Response tab **Route:** `/developer-guide/:domain/:version/:useCase`

**User Journey:** Paging through a large schema table (page 3+), then expanding a collapsed nested object.

**Current Behaviour:** `SchemaTree/index.tsx:22-44` recomputes `flatRows` on every expand/collapse toggle; `GuideTable.tsx:68-71` resets to page 1 whenever `rows` gets a new reference, which happens on every expand/collapse.

**Problem:** A user on page 3 who expands a single nested object is silently bounced back to page 1.

**Root Cause:** `GuideTable`'s existing page-reset effect treats a local expand/collapse interaction the same as a dataset change.

**Implementation**

- **Primary Files:** `src/pages/developer-guide/shared/components/GuideTable.tsx:68-71`, `src/pages/developer-guide/RequestResponseTabs/SchemaTree/index.tsx:22-44`

**Required Changes:** Decouple the existing pagination-reset trigger from expand/collapse state changes — e.g. only reset page when `schema`/`spec` change, not `overrides`.

**Acceptance Criteria:** Expanding/collapsing a row while on page 3+ keeps the user on the same page.

**Complexity:** Medium **Priority:** Medium

---

### UX-049 — Actions search box looks functional but has no effect in Graph view

**Page:** Developer Guide — Supported Actions **Route:** within `/developer-guide/:domain/:version/:useCase`

**User Journey:** Typing into "Filter actions…" while in Graph view.

**Current Behaviour:** `SupportedActionsView/index.tsx:43-52` renders the existing `GuideSearchInput` unconditionally, but the filtered results are only consumed by the Cards view; the Graph view receives the full unfiltered list and never reads the search term.

**Problem:** Typing into the search box while in Graph view visibly does nothing, though the input looks identical to the working Cards-view version.

**Root Cause:** The existing search input remains visible and interactive in a view where it has no effect.

**Implementation**

- **Primary Files:** `src/pages/developer-guide/SupportedActionsView/index.tsx:13-27,43-66`

**Required Changes:** Hide or disable the existing `GuideSearchInput` while `view === "graph"`, so the control doesn't appear functional where it currently isn't.

**Acceptance Criteria:** The search input is hidden or disabled while in Graph view.

**Complexity:** Low **Priority:** Medium

---

## 9. Seller Load Testing

### UX-055 — Every API failure on this page is completely silent to the user ⚠️

**Page:** Seller Load Testing **Route:** `/seller-load-testing`

**User Journey:** Creating a session, deleting a session, generating a discovery payload, starting discovery, or starting a load test — each fails at least once during real use.

**Current Behaviour:** None of the five async handlers surface anything to the user on failure — every catch block is `console.error` only (one isn't even that), while the rest of the app (e.g. Seller Onboarding) already uses `toast.error` for equivalent failures.

**Problem:** In every case, the button's spinner simply stops with no error message.

**Root Cause:** None of the `loadTest` endpoints' hooks add a toast on failure, unlike the equivalent pattern already used elsewhere in the app.

**Implementation**

- **Primary Files:** `src/pages/seller-load-testing/useSellerLoadTesting.ts:41-44,54-57`, `src/pages/seller-load-testing/useDiscoverySection.ts:34-38,50-54`, `src/pages/seller-load-testing/usePreorderLoadTest.ts:79-92`

**Required Changes:** Add `toast.error(...)` in every catch block listed above, matching the toast convention already used in Seller Onboarding.

**Acceptance Criteria:** Every one of the five failure paths shows a visible error toast.

**Complexity:** Low **Priority:** Critical

---

### UX-056 — A single polling error permanently stops load-test progress monitoring _(rewritten for release scope)_

**Page:** Seller Load Testing **Route:** `/seller-load-testing`

**User Journey:** Watching a multi-minute load test run's progress.

**Current Behaviour:** `usePreorderLoadTest.ts:73-77` — the first time the status-polling query errors, the effect sets `pollingInterval: 0`, permanently stopping all future polls.

**Problem:** The load test may keep running server-side for its full duration, but one transient network blip during polling permanently freezes the UI's already-existing progress display, with no way to see it update again short of leaving and re-entering the page.

**Root Cause:** The existing polling effect treats a single error as terminal.

**Implementation**

- **Primary Files:** `src/pages/seller-load-testing/usePreorderLoadTest.ts:39-44,73-77`

**Required Changes:** Don't set `pollingInterval` to `0` after a single query error; let the existing polling interval continue on its current schedule so a transient blip doesn't permanently end an already-running poll.

**Acceptance Criteria:** A single transient poll failure does not permanently stop the existing progress monitoring.

**Complexity:** Low **Priority:** Critical

---

### UX-057 — "Start Search" can silently submit a stale payload when the user's JSON edit is invalid

**Page:** Seller Load Testing **Route:** `/seller-load-testing` (Discovery section)

**User Journey:** Hand-editing the generated search payload in the JSON textarea, introducing a syntax error, then clicking "Start Search."

**Current Behaviour:** `handleEditedJsonChange` (`useDiscoverySection.ts:57-66`) sets the existing `jsonError` state to `"Invalid JSON"` on parse failure but leaves `payload` (the value actually submitted) at its last valid value. The "Start Search" button has no `disabled` tied to `jsonError`.

**Problem:** The user can see "Invalid JSON" already displayed and still click "Start Search," which silently submits the previous valid payload instead of what's on screen.

**Root Cause:** The already-existing `jsonError` state is decoupled from the submit action's enablement.

**Implementation**

- **Primary Files:** `src/pages/seller-load-testing/DiscoverySection.tsx:74-91`

**Required Changes:** Add `disabled={!!jsonError}` to the "Start Search" button, using the existing `jsonError` state.

**Acceptance Criteria:** With an invalid JSON edit present, "Start Search" is disabled until the error is fixed.

**Complexity:** Low **Priority:** High

---

### UX-058 — Destructive session actions ("Delete", "New Session") have no confirmation

**Page:** Seller Load Testing **Route:** `/seller-load-testing`

**User Journey:** Clicking "New Session" or "Delete" while a discovery step or load test run is in progress.

**Current Behaviour:** `SessionCard.tsx:53-69` wires both buttons directly to their handlers with no confirmation step.

**Problem:** Either click abandons/deletes the session — and any in-flight run's results — instantly.

**Root Cause:** No confirmation pattern applied to either action.

**Implementation**

- **Primary Files:** `src/pages/seller-load-testing/SessionCard.tsx:53-69`

**Required Changes:** Add a confirmation dialog before both actions, reusing the app's existing confirmation dialog component (the same pattern already used for equivalent destructive actions elsewhere in the app).

**Acceptance Criteria:** Clicking either button prompts a confirmation, using an existing dialog component, before proceeding.

**Complexity:** Low **Priority:** High

---

### UX-064 — "Cancel" in Discovery discards a manually-edited JSON payload without confirmation

**Page:** Seller Load Testing **Route:** `/seller-load-testing` (Discovery section)

**User Journey:** Hand-editing the generated search payload, then clicking "Cancel."

**Current Behaviour:** `handleCancel` (`useDiscoverySection.ts:68-71`) clears the payload unconditionally when Cancel is clicked, with no confirmation.

**Problem:** A user who hand-edited the payload loses all edits instantly with no confirmation.

**Root Cause:** No dirty-check before discarding.

**Implementation**

- **Primary Files:** `src/pages/seller-load-testing/useDiscoverySection.ts:68-71`

**Required Changes:** If the edited JSON differs from the originally generated payload, show a confirmation before discarding, reusing the app's existing confirmation dialog component.

**Acceptance Criteria:** Clicking Cancel after a manual edit prompts a confirmation; clicking Cancel on an unedited payload does not.

**Complexity:** Low **Priority:** Medium

---

## 10. User Profile

### UX-065 — Page heading contradicts the active sidebar tab

**Page:** User Profile **Route:** `/profile`, `/profile/past-reports`, `/profile/history`

**User Journey:** Landing on `/profile` (default Configs view).

**Current Behaviour:** The sidebar highlights "Configs"/"Past reports"/"Activity history," but the page heading shows `PROFILE_PAGE_COPY.configs.title`, which is literally "Profile" — not "Configs." History's heading reads "History" while the sidebar says "Activity history."

**Problem:** The page heading doesn't echo the highlighted nav item.

**Root Cause:** `PROFILE_PAGE_COPY.configs.title` was set to "Profile" instead of matching the sidebar label.

**Implementation**

- **Primary Files:** `src/pages/user-profile/constants.ts:17-35`

**Required Changes:** Rename the existing `PROFILE_PAGE_COPY.configs.title` string to match the sidebar label (e.g. "Configs"), and align `history.title` with "Activity history."

**Acceptance Criteria:** The page heading always matches the highlighted sidebar label.

**Complexity:** Low (copy-only) **Priority:** Medium

---

### UX-066 — No unsaved-changes warning when navigating away mid-edit on the config form

**Page:** User Profile — Configs **Route:** `/profile`

**User Journey:** Editing or creating a scenario config, then clicking "Past Report."

**Current Behaviour:** `NewConfigForm.tsx:101-107` calls `navigate(ROUTES.PROFILE_PAST_REPORTS)` directly; nothing checks `formState.isDirty`/`editingKey` before this navigation.

**Problem:** Clicking "Past Report" while editing silently discards all typed input with zero warning.

**Root Cause:** Navigation actions don't consult dirty/editing state before leaving.

**Implementation**

- **Primary Files:** `src/pages/user-profile/NewConfigForm.tsx:101-107`

**Required Changes:** Before navigating away while the form is dirty/`editingKey` is set, show a confirm dialog, reusing the `ConfirmDialog` component already imported in `ConfigsSection.tsx`.

**Acceptance Criteria:** Navigating away from a dirty config form prompts a confirmation, using the existing dialog component, before discarding.

**Complexity:** Low **Priority:** High

---

### UX-067 — Config-form validation only fires on submit, not on blur

**Page:** User Profile — Configs **Route:** `/profile`

**User Journey:** Filling the multi-field new-config form.

**Current Behaviour:** `useForm<ScenarioPreferences>(...)` (`useScenarioPreferences.tsx:52-60`) sets no `mode`, defaulting to `onSubmit`. The existing duplicate-name and URL-pattern checks only evaluate on Submit.

**Problem:** A user can fill the entire form before discovering the config name is already taken.

**Root Cause:** No `mode: "onBlur"` passed to `useForm`.

**Implementation**

- **Primary Files:** `src/pages/user-profile/hooks/useScenarioPreferences.tsx:52-60`

**Required Changes:** Pass `mode: "onBlur"` to the existing `useForm` call.

**Acceptance Criteria:** The existing duplicate-name/URL error messages appear on blur, before Submit.

**Complexity:** Low **Priority:** Medium

---

### UX-068 — Domain-data fetch failure is silently swallowed _(rewritten for release scope)_

**Page:** User Profile — Configs **Route:** `/profile`

**User Journey:** Opening the "Create a new config" form when the domain-options fetch fails.

**Current Behaviour:** `fetchDomainData` (`useScenarioPreferences.tsx:94-103`) catches errors with only `console.error`; no toast. `domains` stays `[]`, so dependent dropdowns are empty, yet the form renders as if fine.

**Problem:** The user sees an apparently working, empty form with no indication anything went wrong.

**Root Cause:** try/catch discards the error instead of surfacing it.

**Implementation**

- **Primary Files:** `src/pages/user-profile/hooks/useScenarioPreferences.tsx:94-103`

**Required Changes:** On failure, add `toast.error("Failed to load domain options")` using the app's existing toast mechanism.

**Acceptance Criteria:** A failed domain-options fetch shows a visible error toast.

**Complexity:** Low **Priority:** High

---

### UX-069 — Saved-configs fetch error reads exactly like "no configs yet" _(rewritten for release scope)_

**Page:** User Profile — Configs **Route:** `/profile`

**User Journey:** Opening Profile when the saved-preferences fetch fails.

**Current Behaviour:** `fetchSavedPreferences` (`useScenarioPreferences.tsx:105-118`) has an empty `catch { // No saved preferences yet }` — any error is treated identically to "zero configs," and the existing UI renders "No saved configurations yet. Create one to get started."

**Problem:** A real backend outage is presented with the same wording as "you have nothing saved," which can misleadingly suggest previously-saved configs are gone.

**Root Cause:** Errors and legitimate empty responses render the identical existing message.

**Implementation**

- **Primary Files:** `src/pages/user-profile/hooks/useScenarioPreferences.tsx:105-118`, `src/pages/user-profile/ScenarioTestConfigSection.tsx:19-24`

**Required Changes:** Soften the existing empty-state message's wording so it doesn't assert absence as certain fact (e.g. avoid "yet" implying a confirmed empty state) when the underlying cause could be a fetch error. Keep the same render location and component.

**Acceptance Criteria:** The existing message wording no longer overstates certainty about there being no saved configs.

**Complexity:** Low **Priority:** Medium

---

### UX-072 — "Activity history" sidebar badge reflects only the last search, not a real total

**Page:** User Profile **Route:** `/profile` (sidebar)

**User Journey:** Searching Activity History, seeing a count badge, navigating away and back.

**Current Behaviour:** `ActivityHistorySection.tsx:56-58` sets the badge count to the last search's result size only; it resets to 0 on navigating away.

**Problem:** The badge looks like a persistent "you have N history items" count but is actually just the size of the last search result.

**Root Cause:** The badge is wired to transient per-search local state; no real aggregate count exists today.

**Implementation**

- **Primary Files:** `src/pages/user-profile/ActivityHistorySection.tsx:56-58`, `src/pages/user-profile/index.tsx:42-47`

**Required Changes:** Remove the existing numeric badge from the "Activity history" sidebar nav item, since there is no stable backing count for it today.

**Acceptance Criteria:** The "Activity history" nav item no longer shows a numeric badge.

**Complexity:** Low **Priority:** Low

---

## 11. History

### UX-074 — Homepage CTA "Generate integration report" doesn't match what the destination page does

**Page:** Home → History **Route:** `/` → `/history`

**User Journey:** Clicking "Generate integration report," expecting to produce a new report.

**Current Behaviour:** `src/pages/home/constants.ts:66` labels the existing link "Generate integration report," but the destination only searches/browses existing past sessions — nothing on the page generates a new report.

**Problem:** A first-time user expecting to produce a report lands on a search form for existing sessions.

**Root Cause:** The existing CTA copy describes a capability the target page doesn't have.

**Implementation**

- **Primary Files:** `src/pages/home/constants.ts:66`

**Required Changes:** Rename the existing CTA label to accurately describe the destination page's actual capability (e.g. "View past session reports"). Do not change the link's destination.

**Acceptance Criteria:** The CTA label accurately describes what `/history` lets the user do; its destination is unchanged.

**Complexity:** Low **Priority:** High

---

## 12. Auth Header

### UX-076 — Duplicate "Copy" buttons stacked on the same code in the AI Prompt Generator

**Page:** Auth Header — Overview **Route:** `/auth-header`

**User Journey:** Copying the AI prompt template.

**Current Behaviour:** `AIPromptGenerator.tsx:31-39` renders its own "Copy Prompt" button directly above `<CodeBlock code={AI_PROMPT} .../>` (`:42`), which already has its own built-in copy button — both copy the identical string.

**Problem:** Two visually distinct copy affordances for the exact same content, stacked directly on top of each other.

**Root Cause:** A bespoke copy button was added on top of `CodeBlock`'s already-existing one.

**Implementation**

- **Primary Files:** `src/pages/auth-header/overview/AIPromptGenerator.tsx:31-42`

**Required Changes:** Remove the duplicate top-level "Copy Prompt" button and rely on `CodeBlock`'s existing built-in copy control.

**Acceptance Criteria:** Exactly one copy affordance exists for the AI prompt block.

**Complexity:** Low **Priority:** Low-Medium

---

### UX-078 — No loading state for the Monaco editor mount on the Code Snippets tab

**Page:** Auth Header — Code Snippets **Route:** `/auth-header`

**User Journey:** First navigation to Code Snippets, or a cold page load.

**Current Behaviour:** `CodeEditor.tsx:70-77` renders `@monaco-editor/react`'s `<Editor>` with a fixed height and no `loading` prop.

**Problem:** Monaco's async chunk load can take a moment; without a `loading` prop there can be a blank box before it mounts.

**Root Cause:** The `Editor` component's existing `loading` prop is never set.

**Implementation**

- **Primary Files:** `src/pages/auth-header/code-snippets/CodeEditor.tsx:70-77`

**Required Changes:** Pass `loading={<Spinner className="size-8" />}` — the app's existing spinner component, already used elsewhere for loading states — to the `Editor` component's existing `loading` prop.

**Acceptance Criteria:** A slow Monaco load shows the app's existing spinner instead of blank space.

**Complexity:** Low **Priority:** Low

---

## 13. DB Back Office

### UX-080 — Fetch failure always shows a generic message; the real backend error (404/401/500) is discarded

**Page:** DB Back Office **Route:** `/db-back-office`

**User Journey:** Fetching a payload with an invalid domain/version, expired session, or backend error.

**Current Behaviour:** `useDbBackOffice.ts:62-77` reads `(error as { message?: string }).message || "Failed to fetch data"` — RTK Query's `FetchBaseQueryError` (already available on the caught object) has no `.message` field, so this fallback fires for essentially every failure.

**Problem:** A 404, a 401, and a 500 all render identically as "Failed to fetch data."

**Root Cause:** Error handling assumes a JS `Error`-shaped object; the already-thrown error is shaped `{status, data}`.

**Implementation**

- **Primary Files:** `src/hooks/useDbBackOffice.ts:62-77`

**Required Changes:** Read the already-available `status`/`data` fields on the caught error object and include them in the existing toast message, e.g. `` `Fetch failed (${status}): ${data?.message ?? "check domain/version"}` ``. No API-layer change — the status is already present on the error object being caught.

**Acceptance Criteria:** A 404 and a 500 show visibly different, informative messages in the existing toast.

**Complexity:** Low **Priority:** High

---

### UX-082 — Required-field validation only fires after clicking Fetch, via a message that doesn't say which field is empty _(rewritten for release scope)_

**Page:** DB Back Office **Route:** `/db-back-office`

**User Journey:** Clicking "Fetch Data" with Domain or Version empty.

**Current Behaviour:** `useDbBackOffice.ts:56-59` shows `toast.error("Domain and Version are required")` regardless of which field is actually empty.

**Problem:** The user must guess which of the two fields is missing.

**Root Cause:** The existing toast message doesn't use the already-available information about which specific field(s) are empty.

**Implementation**

- **Primary Files:** `src/hooks/useDbBackOffice.ts:55-59`

**Required Changes:** Change the existing toast message to name the specific empty field(s) (e.g. "Domain is required" / "Version is required" / "Domain and Version are required"), using the already-available `fetchParams` values already being checked.

**Acceptance Criteria:** The existing toast names the specific missing field(s) instead of a generic combined message.

**Complexity:** Low **Priority:** Medium

---

### UX-083 — No Enter-key submission on the Fetch form, inconsistent with the Login form on the same page

**Page:** DB Back Office **Route:** `/db-back-office`

**User Journey:** Typing domain/version and pressing Enter.

**Current Behaviour:** `FetchForm.tsx` has no `<form>` wrapper; the "Fetch Data" button is `type="button"`. `LoginForm.tsx:33` on the same page already wraps its inputs in `<form onSubmit={onLogin}>`.

**Problem:** Pressing Enter after filling the fetch fields does nothing, while the Login form on the same page already supports it.

**Root Cause:** Markup doesn't use a `<form>` element for the fetch fields.

**Implementation**

- **Primary Files:** `src/pages/db-back-office/FetchForm.tsx:9-86`

**Required Changes:** Wrap the fields in `<form onSubmit={(e) => { e.preventDefault(); onFetch(); }}>` and change the button to `type="submit"`, matching the existing `LoginForm` pattern already on this page.

**Acceptance Criteria:** Pressing Enter in either field submits the fetch, matching the existing Login form's behavior.

**Complexity:** Low **Priority:** Medium

---

### UX-084 — Logout resets the Action filter to `""` instead of its own documented "any" default

**Page:** DB Back Office **Route:** `/db-back-office`

**User Journey:** Logging out and back in.

**Current Behaviour:** Initial state sets `fetchParams.action = "any"` (`useDbBackOffice.ts:22-27`); `handleLogout` (`:80-90`) resets it to `""` instead.

**Problem:** After a logout/login cycle, the Action combo box shows blank instead of the "any" default a fresh page load already shows.

**Root Cause:** `handleLogout`'s reset value doesn't match the already-existing initial-state value.

**Implementation**

- **Primary Files:** `src/hooks/useDbBackOffice.ts:22-27,84-89`

**Required Changes:** Set `action: "any"` in `handleLogout`'s reset to match the existing initial state.

**Acceptance Criteria:** After logout/login, the Action filter shows "any," matching a fresh page load.

**Complexity:** Low **Priority:** Low

---

## 14. Framework Health

### UX-085 — Health-check failure shows a generic message regardless of cause, including a real 5-minute timeout

**Page:** Framework Health **Route:** `/framework-health`

**User Journey:** Clicking "Test API Services" and waiting through a check that can take up to 5 minutes.

**Current Behaviour:** `useFrameworkHealth.ts:54-70` uses the same message-less-error-object pattern as UX-080. The existing running-notice copy says "This may take a minute or two" (`index.tsx:223-226`) — far short of the endpoint's actual configured 5-minute timeout.

**Problem:** A genuine timeout after 5 minutes gets the same opaque "Health check failed" message as an instant network error, and the existing wait-time copy already understates the real timeout.

**Root Cause:** Same message-shape assumption as UX-080; existing copy doesn't match the real configured timeout.

**Implementation**

- **Primary Files:** `src/hooks/useFrameworkHealth.ts:54-70`, `src/pages/framework-health/index.tsx:223-226`

**Required Changes:** Read the already-available `status`/`data` fields on the caught error to make the existing toast message more specific (same approach as UX-080). Correct the existing "This may take a minute or two" copy to match the endpoint's real configured timeout.

**Acceptance Criteria:** The existing toast is more specific about the failure; the existing wait-time copy matches the real timeout.

**Complexity:** Low **Priority:** High

---

### UX-087 — Previous health-check results vanish the instant a re-run starts _(rewritten for release scope)_

**Page:** Framework Health **Route:** `/framework-health`

**User Journey:** Clicking "Test API Services" again after already having a report.

**Current Behaviour:** `runApiServiceCheck` (`useFrameworkHealth.ts:54-56`) does `setIsRunning(true); setReport(null);` synchronously before awaiting the request.

**Problem:** Re-running immediately wipes the last-known healthy/unhealthy grid; if the new run then fails, the user is left with nothing at all.

**Root Cause:** The existing report is cleared before the new one is confirmed to exist.

**Implementation**

- **Primary Files:** `src/hooks/useFrameworkHealth.ts:54-70`

**Required Changes:** Remove the `setReport(null)` call from the start of `runApiServiceCheck`; only replace the existing `report` state once a new result actually lands. On failure, leave the last-known report in place unchanged.

**Acceptance Criteria:** Starting a re-run keeps the previous report visible until new data arrives or the run fails.

**Complexity:** Low **Priority:** Medium

---

## 15. Summary Table

| Page                    | Improvements                   | Critical | High Priority | Medium Priority | Low Priority |
| ----------------------- | ------------------------------ | -------- | ------------- | --------------- | ------------ |
| Global Nav/Layout/Auth  | 3 (UX-001,002,004)             | 1        | 1             | 1               | 0            |
| Home                    | 2 (UX-005,007)                 | 0        | 1             | 1               | 0            |
| Support                 | 0                              | 0        | 0             | 0               | 0            |
| Scenario & Flow Testing | 6 (UX-010–015)                 | 0        | 3             | 3               | 0            |
| Schema Validation       | 3 (UX-017–019)                 | 0        | 0             | 1               | 2            |
| Seller Onboarding       | 6 (UX-021,023,025–027,029)     | 1        | 1             | 2               | 2            |
| Protocol Playground     | 6 (UX-030,031,036,037,040,041) | 1        | 1             | 3               | 1            |
| Developer Guide         | 4 (UX-043,047–049)             | 0        | 0             | 4               | 0            |
| Seller Load Testing     | 5 (UX-055–058,064)             | 2        | 2             | 1               | 0            |
| User Profile            | 6 (UX-065–069,072)             | 0        | 2             | 3               | 1            |
| History                 | 1 (UX-074)                     | 0        | 1             | 0               | 0            |
| Auth Header             | 2 (UX-076,078)                 | 0        | 0             | 0               | 2            |
| DB Back Office          | 4 (UX-080,082–084)             | 0        | 1             | 2               | 1            |
| Framework Health        | 2 (UX-085,087)                 | 0        | 1             | 1               | 0            |
| **Total**               | **50**                         | **5**    | **14**        | **22**          | **9**        |

**Critical items (fix first):** UX-001 (env banner clips all pages), UX-021 (seller onboarding: unawaited submit → duplicate submission + contradictory toasts), UX-030 (Playground silently discards invalid JSON edits), UX-055 & UX-056 (seller load testing is silent on every failure and can permanently stop progress monitoring on a single transient error).

**Removed across all rescoping passes** (new capabilities, product decisions, backend dependencies, content/navigation restructuring, requiring a new button/dialog/banner/indicator/retry-affordance/validation-workflow not already present in the existing UI, or — in the final review — carrying noticeable implementation risk or changing what the product communicates rather than polishing it): UX-003, UX-006, UX-008, UX-009, UX-016, UX-020, UX-022, UX-024, UX-028, UX-032, UX-033, UX-034, UX-035, UX-038, UX-039, UX-042, UX-044, UX-045, UX-046, UX-050, UX-051, UX-052, UX-053, UX-054, UX-059, UX-060, UX-061, UX-062, UX-063, UX-070, UX-071, UX-073, UX-075, UX-079, UX-081, UX-086, UX-088.

Notably removed in the strict existing-UI-only pass despite being flagged Critical/High in the original audit: UX-020 (attaching real validation rules to Seller Onboarding's cosmetically-"required" fields — this blocks submission where it currently doesn't, which is a new validation workflow, not a polish of an existing one) and UX-022 (its tab-error-indicator and auto-switch-to-invalid-tab both introduce new UI/navigation). These remain real, evidence-backed defects — a seller can currently submit onboarding data with blank required fields — but implementing a genuine fix requires deciding how strict the new validation should be and how to surface it, which is a product decision, not a pure UI-polish task. Recommend tracking these separately for explicit product sign-off rather than silent inclusion in a "polish" release.
