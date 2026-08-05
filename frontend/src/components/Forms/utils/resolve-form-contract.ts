import type { FormFieldConfigType } from "@components/Forms/config-form/types";

import { FORM_CONTRACTS } from "./form-contracts";
import type { IExpectedField, IFormContractIssue } from "./html-form-contract";

// Resolving a contract means answering "which form is this step showing?". Form names are only
// unique within a domain + sub-domain (consumer_information_form exists under FIS12, FIS13/motor and
// FIS13/health), so the name alone is not a key — it has to be qualified by the session's domain and,
// where a domain has sub-domains, by a hint that picks between them.

export interface IFormContractContext {
    /** Session domain, e.g. "ONDC:FIS13" or "FIS13". */
    domain?: string | null;
    /** Extra tokens used to pick a sub-domain (usecase id, active flow id, …). */
    hints?: (string | null | undefined)[];
}

export interface IResolvedFormContract {
    /** Undefined when no contract could be resolved — structural checks then run on their own. */
    expectedFields?: IExpectedField[];
    /** Registry key the contract came from, for display. */
    key?: string;
    source?: "inline" | "ref" | "registry";
    /** Set when a form name matched several registry keys and none could be picked. */
    ambiguousKeys?: string[];
    /** The form name that was derived, whether or not a contract was found. */
    formName?: string;
}

/** `$.reference_data.individual_information_form` → `individual_information_form` */
function formNameFromReference(reference?: string): string | undefined {
    if (!reference) return undefined;
    const segments = reference
        .replace(/\[[^\]]*\]/g, "")
        .split(".")
        .map((segment) => segment.trim())
        .filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === "$" || last === "reference_data") return undefined;
    return last;
}

/**
 * Pulls a form name out of a form-service style URL, e.g.
 * `https://host/forms/FIS13/health/individual_information_form?session_id=…` → the trailing segments.
 * Real seller URLs rarely follow this shape, which is why `expectedFieldsRef` exists.
 */
function formPathFromUrl(formUrl?: string): string | undefined {
    if (!formUrl) return undefined;
    let pathname = formUrl;
    try {
        pathname = new URL(formUrl).pathname;
    } catch {
        pathname = formUrl.split("?")[0];
    }
    const segments = pathname.split("/").filter(Boolean);
    const formsIndex = segments.lastIndexOf("forms");
    const after = formsIndex >= 0 ? segments.slice(formsIndex + 1) : segments;
    const trimmed = after.filter((segment) => segment !== "submit" && segment !== "direct");
    return trimmed.length ? trimmed.join("/") : undefined;
}

/** "ONDC:FIS13" → "FIS13"; "fis13" → "FIS13". Registry keys use the bare uppercase code. */
function normalizeDomain(domain?: string | null): string | undefined {
    if (!domain) return undefined;
    const bare = domain.includes(":") ? domain.split(":").pop() : domain;
    return bare ? bare.trim().toUpperCase() : undefined;
}

/** Tokens a sub-domain could be named with, e.g. "MOTOR_INSURANCE_APPLICATION" → ["motor", "insurance", …] */
function hintTokens(hints: (string | null | undefined)[]): string[] {
    const tokens = new Set<string>();
    for (const hint of hints) {
        if (!hint) continue;
        for (const token of hint.toLowerCase().split(/[^a-z0-9]+/)) {
            if (token.length > 2) tokens.add(token);
        }
    }
    return [...tokens];
}

/**
 * Resolves the contract for one HTML_FORM step. Precedence:
 *   1. `expectedFields` inline on the step (per-flow override)
 *   2. `expectedFieldsRef` — an explicit registry key
 *   3. registry lookup by derived form name, qualified by domain and sub-domain hints
 */
export function resolveFormContract(
    config: Pick<FormFieldConfigType, "expectedFields" | "expectedFieldsRef" | "reference">,
    options: { formUrl?: string; context?: IFormContractContext } = {}
): IResolvedFormContract {
    if (config.expectedFields?.length) {
        return { expectedFields: config.expectedFields, source: "inline" };
    }

    if (config.expectedFieldsRef) {
        const key = config.expectedFieldsRef;
        const expectedFields = FORM_CONTRACTS[key];
        return expectedFields
            ? { expectedFields, key, source: "ref" }
            : { key, source: "ref", formName: key };
    }

    const { formUrl, context } = options;
    const domain = normalizeDomain(context?.domain);

    // A URL path can carry the sub-domain too ("FIS13/health/individual_information_form"), so try it
    // as a whole key before falling back to the bare name.
    const urlPath = formPathFromUrl(formUrl);
    const referenceName = formNameFromReference(config.reference);
    const formName = referenceName ?? (urlPath ? urlPath.split("/").pop() : undefined);

    const directCandidates = [
        urlPath,
        urlPath && domain ? `${domain}/${urlPath}` : undefined,
        formName && domain ? `${domain}/${formName}` : undefined,
    ].filter((candidate): candidate is string => !!candidate);

    for (const candidate of directCandidates) {
        const expectedFields = FORM_CONTRACTS[candidate];
        if (expectedFields) return { expectedFields, key: candidate, source: "registry", formName };
    }

    if (!formName) return {};

    // Sub-domain unknown: narrow the keys ending in this form name using the session hints.
    const suffix = `/${formName}`;
    const prefix = domain ? `${domain}/` : "";
    const matches = Object.keys(FORM_CONTRACTS).filter(
        (key) => key.endsWith(suffix) && key.startsWith(prefix)
    );

    if (matches.length === 1) {
        return {
            expectedFields: FORM_CONTRACTS[matches[0]],
            key: matches[0],
            source: "registry",
            formName,
        };
    }
    if (matches.length > 1) {
        const tokens = hintTokens(context?.hints ?? []);
        const byHint = matches.filter((key) => {
            const middle = key.slice(prefix.length, key.length - suffix.length).toLowerCase();
            return middle.length > 0 && tokens.some((token) => middle.includes(token));
        });
        if (byHint.length === 1) {
            return {
                expectedFields: FORM_CONTRACTS[byHint[0]],
                key: byHint[0],
                source: "registry",
                formName,
            };
        }
        return { ambiguousKeys: matches, formName };
    }

    return { formName };
}

/**
 * An ambiguous form name is a config problem, not a seller problem — report it so the author knows
 * the form went unchecked instead of silently skipping the contract.
 */
export function contractResolutionIssues(resolved: IResolvedFormContract): IFormContractIssue[] {
    if (!resolved.ambiguousKeys?.length) return [];
    return [
        {
            code: "contract-ambiguous",
            severity: "warning",
            message: `Form name "${resolved.formName}" matches several contracts (${resolved.ambiguousKeys.join(
                ", "
            )}) — set expectedFieldsRef on this step to pick one. Field-level checks were skipped.`,
        },
    ];
}

/** One-line summary of what the form was checked against, for display under the form. */
export function describeResolvedContract(resolved: IResolvedFormContract): string {
    if (resolved.source === "inline") return "Checked against the contract set on this flow step";
    if (resolved.expectedFields && resolved.key) return `Checked against contract ${resolved.key}`;
    if (resolved.ambiguousKeys?.length) return "No contract applied (ambiguous form name)";
    if (resolved.formName) return `No contract registered for "${resolved.formName}"`;
    return "No contract applied (form name could not be derived)";
}
