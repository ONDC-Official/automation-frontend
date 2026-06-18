import { ReactNode } from "react";
import { IGAEvent } from "@/types/analytics";

export type FooterLinkColumnProps = {
    title: string;
    links: IFooterLink[];
};

export type IFooterLinkItemProps = {
    link: IFooterLink;
};
export interface IFooterLink {
    name: string;
    href: string;
    analytics: IGAEvent;
}
export interface ISocialLink {
    name: string;
    href: string;
    icon: ReactNode;
    analytics: IGAEvent;
}

export interface IFooterLinks {
    company: IFooterLink[];
    developers: IFooterLink[];
    support: IFooterLink[];
    quickLinks: IFooterLink[];
}
