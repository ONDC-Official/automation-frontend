import type { IDomain } from "@pages/schema-validation/types";
import {
    SCENARIO_DOMAIN_LABELS,
    getScenarioDomainLabel,
    sortedDomainOptions,
} from "@pages/scenario/constants";

describe("domain labels", () => {
    it("never bakes a version number into a friendly label", () => {
        // A version belongs in the Version field, not the domain's name — these
        // three used to read "... 1.2.0 ...", "... 1.2.5 ...".
        expect(SCENARIO_DOMAIN_LABELS["nic2004:60232"]).toBe("Logistics (nic2004:60232)");
        expect(SCENARIO_DOMAIN_LABELS["ONDC:LOG10"]).toBe("Logistics P2P (LOG10)");
        expect(SCENARIO_DOMAIN_LABELS["ONDC:LOG11"]).toBe("Logistics P2H2P (LOG11)");
        // Spot-check: no label in the whole map contains a version-looking token.
        Object.values(SCENARIO_DOMAIN_LABELS).forEach((label) => {
            expect(label).not.toMatch(/\d+\.\d+(\.\d+)?/);
        });
    });

    it("falls back to the raw code for a domain with no friendly label", () => {
        expect(getScenarioDomainLabel("ONDC:NOT-IN-MAP")).toBe("ONDC:NOT-IN-MAP");
    });
});

describe("sortedDomainOptions", () => {
    const domainsOf = (...keys: string[]): IDomain[] =>
        keys.map((key) => ({ key, version: [] }) as unknown as IDomain);

    it("sorts labeled domains alphabetically by their friendly label", () => {
        // Grocery, F&B, Fashion -> alphabetically: F&B, Fashion, Grocery
        const options = sortedDomainOptions(domainsOf("ONDC:RET10", "ONDC:RET11", "ONDC:RET12"));
        expect(options.map((o) => o.label)).toEqual([
            "F&B (RET11)",
            "Fashion (RET12)",
            "Grocery (RET10)",
        ]);
    });

    it("puts domains with no friendly label at the end, after every labeled one", () => {
        const options = sortedDomainOptions(
            domainsOf("ONDC:NTS20", "ONDC:RET10", "ONDC:AGR10", "ONDC:RET11", "ONDC:NTS10")
        );
        // Labeled (Grocery, F&B) sorted first; unlabeled (raw codes) after, also sorted.
        expect(options.map((o) => o.value)).toEqual([
            "ONDC:RET11", // F&B (RET11)
            "ONDC:RET10", // Grocery (RET10)
            "ONDC:AGR10", // no label -> raw code
            "ONDC:NTS10", // no label -> raw code
            "ONDC:NTS20", // no label -> raw code
        ]);
    });

    it("keeps each option's value as the domain's own key, never the sorted position", () => {
        const options = sortedDomainOptions(domainsOf("ONDC:RET12", "ONDC:RET10"));
        options.forEach((o) => {
            expect(o.value).toMatch(/^ONDC:/);
        });
        expect(new Set(options.map((o) => o.value))).toEqual(new Set(["ONDC:RET10", "ONDC:RET12"]));
    });

    it("returns an empty list for an empty domains array", () => {
        expect(sortedDomainOptions([])).toEqual([]);
    });
});
