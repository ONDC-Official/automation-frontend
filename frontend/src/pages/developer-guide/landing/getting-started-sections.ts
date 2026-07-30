import type { BuildEntry } from "../types";
import { isUseCaseEnabled } from "../utils";

/** Sidebar + in-page section anchors for Getting Started (Stripe-style hub). */
export const GETTING_STARTED_SECTIONS = [
    { id: "start-with-a-use-case", label: "Start with a use case" },
    { id: "common-paths", label: "Common paths" },
    { id: "start-exploring", label: "Start exploring" },
    { id: "more-resources", label: "More resources" },
    { id: "how-to", label: "How to" },
] as const;

/** Walkthrough videos shown under the How to section. */
export const HOW_TO_GUIDES = [
    {
        id: "schema-validation",
        title: "Schema Validation",
        description: "See how to validate request and response payloads against domain schemas.",
        videoUrl:
            "https://drive.google.com/file/d/1W8Pgv494Kqqbn6GVJL01lzSjrsdA8blV/view?usp=sharing",
    },
] as const;

export type GettingStartedSectionId = (typeof GETTING_STARTED_SECTIONS)[number]["id"];

export interface ReferenceUseCase {
    domainKey: string;
    versionKey: string;
    label: string;
}

/** Prefer FIS12 LAMF when present; otherwise the first enabled use case. */
export function findReferenceUseCase(builds: BuildEntry[]): ReferenceUseCase | null {
    const enabled = builds.filter((dom) =>
        (dom.version ?? []).some((ver) =>
            (ver.usecase ?? []).some((uc) => isUseCaseEnabled(dom, uc))
        )
    );

    const fis12 = enabled.find((dom) => /FIS12/i.test(dom.key));
    const preferDomains = fis12 ? [fis12, ...enabled.filter((d) => d !== fis12)] : enabled;

    for (const dom of preferDomains) {
        for (const ver of [...(dom.version ?? [])].reverse()) {
            const usecases = ver.usecase ?? [];
            const lamf = usecases.find((uc) => /lamf/i.test(uc));
            const pick = lamf ?? usecases.find((uc) => isUseCaseEnabled(dom, uc));
            if (pick) {
                return { domainKey: dom.key, versionKey: ver.key, label: pick };
            }
        }
    }

    return null;
}
