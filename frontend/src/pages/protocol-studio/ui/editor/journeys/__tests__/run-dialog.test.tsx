import { fireEvent, render, screen } from "@testing-library/react";
import type { GraphNodeV2 } from "@ondc/automation-mock-runner";

import type { StudioRunActions } from "@pages/protocol-studio/hooks/use-studio-run";
import { RunDialog, sanitizeFormHtml } from "@pages/protocol-studio/ui/editor/journeys/run-dialog";

// The inputs form (RJSF) reads Vite's import.meta.env; a form step doesn't use it.
jest.mock("@components/JsonSchemaForm", () => ({
    __esModule: true,
    default: () => null,
    PLAYGROUND_RJSF_FORM_ID: "playground-rjsf-form",
}));

/**
 * The lib's default form (`getDefaultForm`, automation-mock-runner-lib
 * src/lib/constants/function-registry.ts), with a stylesheet in its head and
 * an attack in its body.
 */
const FORM = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ENTER FORM TITLE HERE</title>
  <style>.form-row { margin-bottom: 12px; }</style>
  <script>window.__pwned = true;</script>
</head>

<body>
  <img src=x onerror="window.__pwned = true">
  <!-- note: update the form id here and don't change the actionUrl template -->
  <form id="additionalDetailsForm" method="POST" action="<%= actionUrl %>">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" />

    <label for="country">Country</label>
    <input type="text" id="country" name="country" />

    <label for="countryCode">Country Code</label>
    <input type="text" id="countryCode" name="countryCode" />

    <label for="age">Age</label>
    <input type="text" id="age" name="age" />

    <label for="email">Email ID</label>
    <input type="text" id="email" name="email" />

    <label for="gender">Gender</label>
    <select name="gender" id="gender">
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="transgender">Transgender</option>
    </select>

    <label for="phoneNumber">Phone number</label>
    <input type="text" id="phoneNumber" name="phoneNumber" />

    <label for="idProof">ID Proof</label>
    <select name="idProof" id="idProof">
      <option value="passport">Passport</option>
    </select>

    <label for="passportNumber">Passport Number</label>
    <input type="text" id="passportNumber" name="passportNumber" />
  	<!-- note: do not remove the submit button-->
    <input type="submit" value="Submit">
    <a href="javascript:window.__pwned = true">help</a>
  </form>
</body>

</html>`;

const node = {
    id: "form_1",
    api: "form",
    owner: "BAP",
    kind: "form",
} as unknown as GraphNodeV2;

describe("sanitizeFormHtml", () => {
    it("strips scripts and handlers, and keeps the fields and the head's style", () => {
        const clean = sanitizeFormHtml(FORM);
        expect(clean).not.toMatch(/onerror|<script|javascript:|__pwned/);
        expect(clean).toContain('name="name"');
        expect(clean).toContain('name="passportNumber"');
        expect(clean).toMatch(/<head>[\s\S]*<style>\.form-row \{ margin-bottom: 12px; \}<\/style>/);
    });
});

describe("RunDialog: a form step", () => {
    it("renders the sanitised form, and submits its fields", () => {
        const submitForm = jest.fn(async () => {});
        const actions = { submitForm, cancelPending: jest.fn() } as unknown as StudioRunActions;
        render(
            <RunDialog
                pending={{ kind: "form", node, html: FORM }}
                actions={actions}
                container={document.body}
            />
        );
        const dialog = screen.getByRole("dialog");
        expect(dialog.querySelector("[onerror]")).toBeNull();
        expect(dialog.querySelector("script")).toBeNull();
        expect(dialog.querySelector("style")?.textContent).toContain(".form-row");
        const name = dialog.querySelector<HTMLInputElement>('input[name="name"]');
        expect(name).not.toBeNull();
        expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();

        fireEvent.change(name!, { target: { value: "Asha" } });
        fireEvent.submit(dialog.querySelector("form")!);
        expect(submitForm).toHaveBeenCalledWith(expect.objectContaining({ name: "Asha" }));
    });
});
