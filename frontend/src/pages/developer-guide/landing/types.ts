import type { ReactNode } from "react";
import type { BuildEntry } from "../types";
import type { DomainFamilyGroup } from "../domainGrouping";

export interface DomainCardsSectionProps {
    domains?: BuildEntry[];
    domainFamilies?: DomainFamilyGroup[];
    error: string | null;
    isDomainEnabled: (dom: BuildEntry) => boolean;
    isUseCaseEnabled: (dom: BuildEntry, usecaseLabel: string) => boolean;
    onUseCaseClick: (dom: BuildEntry, versionKey: string, usecaseLabel: string) => void;
}

export interface FeatureCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
}

export interface RecommendedSectionProps {
    onGettingStartedClick: () => void;
    onAuthToolsClick: () => void;
}
