import { FC, useMemo, ReactNode } from "react";

import AccordionDataComponent from "@components/Shadcn/Accordion";
import { SCHEMA_GUIDE_STEPS } from "@pages/schema-validation/constants";
import { useGetScenarioFormDataQuery } from "@store/api";
import {
    getDomainFamilyKey,
    getDomainFamilyLabel,
    getDomainFriendlyName,
} from "@pages/developer-guide/domainGrouping";

const FAMILY_LABELS: Record<string, string> = {
    FIS: "Financial Services",
    LOG: "Logistics",
    TRV: "Mobility Transit and Travel",
    RET: "Retail",
    NTS: "Reconciliation (NTS)",
};

function formatWord(word: string): string {
    const lower = word.toLowerCase();
    if (lower === "eb2b") return "eB2B";
    if (lower === "f&b") return "F&B";
    if (lower === "bpc") return "BPC";
    if (lower === "p2p") return "P2P";
    if (lower === "p2h2p") return "P2H2P";
    if (lower === "nts10") return "NTS10";
    if (lower === "retinvl") return "RETINVL";
    if (lower === "nic2004") return "NIC2004";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatUsecase(usecase: string): string {
    return usecase.replace(/[a-zA-Z0-9&]+/g, (word) => formatWord(word));
}

/**
 * Builds bullet-point lines for a single domain by grouping usecases
 * that share the exact same set of versions together.
 *
 * e.g. TRV11 with Bus(v2.0.0,v2.0.1,v2.1.0) and Metro(v2.0.0,v2.0.1,v2.1.0)
 * → one bullet: "TRV11 - Bus, Metro (v2.0.0, v2.0.1, v2.1.0)"
 *
 * But if usecases have different version sets they get separate bullets.
 */
interface VersionEntry {
    key: string;
    usecase?: string[];
}

function buildDomainBullets(
    domainKey: string,
    versions: VersionEntry[]
): { label: string; versionsText: string }[] {
    const shortCode = domainKey.replace(/^ONDC:/i, "");

    // Build usecase → sorted version keys
    const usecaseVersionMap = new Map<string, Set<string>>();
    for (const ver of versions) {
        for (const uc of ver.usecase || []) {
            if (!usecaseVersionMap.has(uc)) {
                usecaseVersionMap.set(uc, new Set());
            }
            usecaseVersionMap.get(uc)!.add(ver.key);
        }
    }

    // If no usecases at all, fall back to the friendly name with all versions
    if (usecaseVersionMap.size === 0) {
        const allVersions = [...new Set(versions.map((v) => v.key))].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
        return [
            {
                label: `${shortCode} - ${getDomainFriendlyName(domainKey)}`,
                versionsText: allVersions.map((v) => `v${v}`).join(", "),
            },
        ];
    }

    // Group usecases by their version-set fingerprint
    const versionSetGroups = new Map<string, { usecases: string[]; versions: string[] }>();
    for (const [uc, verSet] of usecaseVersionMap) {
        const sortedVersions = [...verSet].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
        const fingerprint = sortedVersions.join("|");
        if (!versionSetGroups.has(fingerprint)) {
            versionSetGroups.set(fingerprint, { usecases: [], versions: sortedVersions });
        }
        versionSetGroups.get(fingerprint)!.usecases.push(uc);
    }

    // Build one bullet per group
    const bullets: { label: string; versionsText: string }[] = [];
    for (const [, group] of versionSetGroups) {
        const usecaseLabel = group.usecases
            .map(formatUsecase)
            .sort((a, b) => a.localeCompare(b))
            .join(", ");
        bullets.push({
            label: `${shortCode} - ${usecaseLabel}`,
            versionsText: group.versions.map((v) => `v${v}`).join(", "),
        });
    }

    // Sort bullets alphabetically by label
    return bullets.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Collapsible how-to guide for the schema validation page.
 */
const SchemaGuideAccordion: FC = () => {
    const { data: scenarioFormData } = useGetScenarioFormDataQuery();

    const steps = useMemo(() => {
        if (!scenarioFormData?.domain) {
            return SCHEMA_GUIDE_STEPS;
        }

        // Group domains by family key
        const grouped = scenarioFormData.domain.reduce(
            (acc, domain) => {
                const familyKey = getDomainFamilyKey(domain.key);
                if (!acc[familyKey]) {
                    acc[familyKey] = [];
                }
                acc[familyKey].push(domain);
                return acc;
            },
            {} as Record<string, typeof scenarioFormData.domain>
        );

        // Sort family keys to have a deterministic order
        const sortedFamilyKeys = Object.keys(grouped).sort((a, b) => {
            const labelA = FAMILY_LABELS[a] || getDomainFamilyLabel(a) || a;
            const labelB = FAMILY_LABELS[b] || getDomainFamilyLabel(b) || b;
            return labelA.localeCompare(labelB);
        });

        const listItems: ReactNode[] = sortedFamilyKeys.map((familyKey, familyIndex) => {
            const familyLabel =
                FAMILY_LABELS[familyKey] || getDomainFamilyLabel(familyKey) || familyKey;
            const domains = grouped[familyKey].sort((a, b) =>
                a.key.toLowerCase().localeCompare(b.key.toLowerCase())
            );

            return (
                <div key={familyKey} className="mb-4 last:mb-0">
                    <div className="font-bold text-n-800 dark:text-n-0 mb-1">
                        {familyIndex + 1}. {familyLabel}
                    </div>
                    <ul className="list-disc pl-6 space-y-1 text-body-2 text-n-500 dark:text-n-60">
                        {domains.flatMap((domain) =>
                            buildDomainBullets(domain.key, domain.version).map((bullet, idx) => (
                                <li key={`${domain.key}-${idx}`}>
                                    {bullet.label} ({bullet.versionsText})
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            );
        });

        return SCHEMA_GUIDE_STEPS.map((step) => {
            if (step.key === "1") {
                return {
                    ...step,
                    items: listItems,
                };
            }
            return step;
        });
    }, [scenarioFormData]);

    return <AccordionDataComponent title="How to use" steps={steps} />;
};

export default SchemaGuideAccordion;
