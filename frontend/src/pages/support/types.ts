export interface ISupportChannelStat {
    label: string;
    value: string;
}

export interface ISupportChannelCard {
    key: string;
    eyebrow: string;
    eyebrowClassName: string;
    title: string;
    features: string[];
    stats: ISupportChannelStat[];
    ctaLabel: string;
    ctaHref: string;
    ctaExternal?: boolean;
    ctaClassName: string;
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
