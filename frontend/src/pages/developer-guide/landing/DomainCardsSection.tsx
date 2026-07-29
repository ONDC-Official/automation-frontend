import { FC, useId, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { IconSearch } from "../shared/icons";
import type { BuildEntry } from "../types";
import type { DomainFamilyGroup } from "../domainGrouping";
import { getDomainFamilyLabel, getDomainShortLabel, groupBuildsByFamily } from "../domainGrouping";
import type { DomainCardsSectionProps } from "./types";
import { Button } from "@/components/Shadcn/Button";
import { resolveNavStatus, NAV_STATUS_STYLES } from "../shared/statusPlaceholders";

interface UseCaseEntry {
    dom: BuildEntry;
    verKey: string;
    label: string;
}

interface DomainUseCaseGroup {
    domainLabel: string;
    useCases: UseCaseEntry[];
}

function collectUseCasesForDomain(
    dom: BuildEntry,
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean
): UseCaseEntry[] {
    return (dom.version ?? [])
        .flatMap((ver) =>
            (ver.usecase ?? []).map((label) => ({
                dom,
                verKey: ver.key,
                label,
            }))
        )
        .sort((a, b) => {
            const aEn = isUseCaseEnabled(a.dom, a.label);
            const bEn = isUseCaseEnabled(b.dom, b.label);
            if (aEn !== bEn) return aEn ? -1 : 1;
            return a.label.localeCompare(b.label) || a.verKey.localeCompare(b.verKey);
        });
}

function collectUseCasesByDomain(
    family: DomainFamilyGroup,
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean
): DomainUseCaseGroup[] {
    return family.domains
        .map((dom) => ({
            domainLabel: getDomainShortLabel(dom.key),
            useCases: collectUseCasesForDomain(dom, isUseCaseEnabled),
        }))
        .filter((group) => group.useCases.length > 0);
}

const DomainFamilyAccordion: FC<{
    family: DomainFamilyGroup;
    familyIndex: number;
    isDomainEnabled: (dom: BuildEntry) => boolean;
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean;
    onUseCaseClick: (dom: BuildEntry, versionKey: string, usecaseLabel: string) => void;
}> = ({ family, familyIndex, isDomainEnabled, isUseCaseEnabled, onUseCaseClick }) => {
    const panelId = useId();
    const [open, setOpen] = useState(false);
    const enabled = family.domains.some(isDomainEnabled);
    const familyTitle = getDomainFamilyLabel(family.familyKey);
    const domainLabels = family.domains.map((d) => getDomainShortLabel(d.key));
    const domainGroups = collectUseCasesByDomain(family, isUseCaseEnabled);
    const useCaseCount = domainGroups.reduce((sum, g) => sum + g.useCases.length, 0);
    const showDomainSections = domainGroups.length > 1;

    const renderUseCaseChip = ({ dom, verKey, label }: UseCaseEntry) => {
        const clickable = isUseCaseEnabled(dom, label);
        const ver = dom.version?.find((v) => v.key === verKey);
        const status = resolveNavStatus({
            domainKey: dom.key,
            versionKey: verKey,
            usecaseLabel: label,
            backendStatus: ver?.usecaseStatus?.[label] ?? ver?.status,
        });
        const statusStyle = NAV_STATUS_STYLES[status];
        return (
            <Button
                key={`${dom.key}-${verKey}-${label}`}
                type="button"
                variant="ghost"
                disabled={!clickable}
                onClick={() => clickable && onUseCaseClick(dom, verKey, label)}
                className={`gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors duration-150 ${
                    clickable
                        ? "bg-white dark:bg-surface-elevated text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:border-sky-300 dark:hover:border-sky-500/50 hover:shadow-xs cursor-pointer shadow-xs"
                        : "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                }`}
            >
                {label}
                <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-caption-2-size font-bold ${
                        clickable ? statusStyle : "bg-slate-100 text-slate-300"
                    }`}
                >
                    v{verKey}
                </span>
            </Button>
        );
    };

    return (
        <section
            className={`bg-white dark:bg-surface-elevated rounded-2xl border overflow-hidden transition-shadow duration-200 ${
                enabled
                    ? "border-sky-200 dark:border-sky-500/30 shadow-xs hover:shadow-md hover:shadow-sky-100/50 dark:hover:shadow-sky-500/10"
                    : "border-slate-200 opacity-60"
            }`}
            style={{
                animationName: "fadeSlideUp",
                animationDuration: "0.35s",
                animationTimingFunction: "ease-out",
                animationFillMode: "both",
                animationDelay: `${familyIndex * 40}ms`,
            }}
        >
            <Button
                type="button"
                variant="ghost"
                className={`h-auto w-full gap-4 rounded-none px-5 py-4 font-normal text-left transition-colors ${
                    enabled ? "hover:bg-sky-50/60 dark:hover:bg-sky-500/10" : "hover:bg-slate-50"
                }`}
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
            >
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        enabled
                            ? "bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        aria-hidden
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                        />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <h3
                        className={`font-bold text-sm leading-snug ${
                            enabled ? "text-slate-900" : "text-slate-500"
                        }`}
                    >
                        {familyTitle}
                    </h3>
                    <p
                        className={`text-xs mt-0.5 font-medium truncate ${
                            enabled ? "text-sky-600 dark:text-sky-400" : "text-slate-400"
                        }`}
                        title={domainLabels.join(", ")}
                    >
                        {domainLabels.length > 1
                            ? domainLabels.join(" · ")
                            : (domainLabels[0] ?? family.label)}
                        {" · "}
                        {useCaseCount} use case{useCaseCount !== 1 ? "s" : ""}
                    </p>
                </div>

                <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        enabled
                            ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-400"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                    }`}
                >
                    <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        aria-hidden
                    />
                </span>
            </Button>

            <div
                id={panelId}
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                aria-hidden={!open}
            >
                <div className="overflow-hidden border-t border-sky-100 dark:border-sky-500/30">
                    <div
                        className={`px-5 py-4 transition-opacity duration-150 ${
                            open ? "opacity-100" : "opacity-0"
                        } ${showDomainSections ? "flex flex-col gap-4" : "flex flex-wrap gap-2"}`}
                    >
                        {showDomainSections
                            ? domainGroups.map(({ domainLabel, useCases }) => (
                                  <div key={domainLabel} className="flex flex-col gap-2">
                                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                                          {domainLabel}
                                          <span className="ml-1.5 font-medium normal-case tracking-normal text-slate-400">
                                              {useCases.length} use case
                                              {useCases.length !== 1 ? "s" : ""}
                                          </span>
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                          {useCases.map(renderUseCaseChip)}
                                      </div>
                                  </div>
                              ))
                            : domainGroups[0]?.useCases.map(renderUseCaseChip)}
                    </div>
                </div>
            </div>
        </section>
    );
};

const DomainCardsSection: FC<DomainCardsSectionProps> = ({
    domains,
    domainFamilies: domainFamiliesProp,
    error,
    isDomainEnabled,
    isUseCaseEnabled,
    onUseCaseClick,
}) => {
    const domainFamilies = domainFamiliesProp ?? (domains ? groupBuildsByFamily(domains) : []);

    if (error) {
        return (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-700 dark:text-red-300">
                <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="shrink-0"
                    aria-hidden
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                {error}
            </div>
        );
    }

    if (domainFamilies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                    <IconSearch className="w-5.5 h-5.5 text-sky-400" aria-hidden />
                </div>
                <p className="text-slate-600 font-semibold text-sm">No domains found</p>
                <p className="text-slate-400 text-xs mt-1">Try adjusting your search term</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {domainFamilies.map((family, familyIndex) => (
                <DomainFamilyAccordion
                    key={`${family.familyKey}-${familyIndex}`}
                    family={family}
                    familyIndex={familyIndex}
                    isDomainEnabled={isDomainEnabled}
                    isUseCaseEnabled={isUseCaseEnabled}
                    onUseCaseClick={onUseCaseClick}
                />
            ))}

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DomainCardsSection;
