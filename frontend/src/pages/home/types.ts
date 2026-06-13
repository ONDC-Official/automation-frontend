import { FC, SVGProps } from "react";

export interface IQuickStep {
    number: string;
    title: string;
    subtitle: string;
    href: string;
    external?: boolean;
}

export interface IPathLink {
    label: string;
    href: string;
    external?: boolean;
}

export interface IPathCard {
    label: string;
    title: string;
    subtitle: string;
    description: string;
    links: IPathLink[];
}

export interface IUsageStat {
    value: string;
    title: string;
    subtitle: string;
}

export interface IUsageSectionProps {
    eyebrow: string;
    title: string;
    description: string;
    stats: IUsageStat[];
}

export interface ISupportCard {
    title: string;
    description: string;
    linkLabel: string;
    href: string;
    Icon: FC<SVGProps<SVGSVGElement>>;
    external?: boolean;
}

export interface ISupportInfoItem {
    label: string;
    title: string;
    subtitle: string;
}
