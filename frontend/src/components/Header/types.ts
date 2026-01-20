import { GAEvent } from "@utils/analytics";

export interface SubMenuItem {
    label: string;
    href: string;
}

export interface NavLink {
    label: string;
    href: string;
    selected: boolean;
    subMenu?: SubMenuItem[];
    analytics?: GAEvent;
}

export interface HeaderProps {
    onSupportClick: () => void;
}

export interface UserDetails {
    githubId: string;
    participantId: string;
    avatarUrl?: string;
}

export interface UserIconProps {
    user: UserDetails;
}
