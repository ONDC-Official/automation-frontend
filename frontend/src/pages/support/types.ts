export interface ISupportChannelStat {
    label: string;
    value: string;
}

export interface ISupportChannelCta {
    label: string;
    href: string;
    external?: boolean;
    className: string;
}

export interface ISupportChannelCard {
    key: string;
    eyebrow: string;
    eyebrowClassName: string;
    title: string;
    features: string[];
    stats: ISupportChannelStat[];
    ctas: ISupportChannelCta[];
}

export interface ISupportHowItWorksStep {
    number: string;
    eyebrow: string;
    title: string;
    description: string;
}

export interface ISupportChannelCardProps {
    card: ISupportChannelCard;
    scenarioSessionReference?: string;
}
