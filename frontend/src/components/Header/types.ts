import { IGAEvent } from "@/types/analytics";
import { ReactNode } from "react";
import { IUser } from "@/types/user";

export interface IUserProfileMenu {
    user: IUser;
    onLogout: () => void;
}

export interface INavigationMenuNavLink {
    to: string;
    children: ReactNode;
    onClick?: () => void;
    closeDrawer?: boolean;
}

export interface INavLink {
    label: string;
    href?: string;
    subMenu?: { label: string; href: string }[];
    analytics?: IGAEvent;
    /** Show a small "Beta" pill pinned to this link's top-right corner. */
    beta?: boolean;
}

export interface INavigationMenuNavItem {
    link: INavLink;
    inDrawer?: boolean;
    onNavClick: (link: INavLink) => void;
}
