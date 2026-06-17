import {
    NavigationMenu,
    NavigationMenuList,
} from "@/components/Shadcn/NavigationMenu/navigation-menu";
import { navLinks } from "@components/Header/constants";
import { NavigationMenuNavItem } from "@components/Header/NavigationMenuNavItem";
import { trackEvent } from "@utils/analytics";
import { INavLink } from "@components/Header/types";

export const NavigationMenuSection = ({ inDrawer = false }: { inDrawer?: boolean }) => {
    const onNavClick = (link: INavLink) => {
        if (link.analytics) {
            trackEvent(link.analytics);
        }
    };

    return (
        <NavigationMenu viewport={false} className="max-w-none flex-1 justify-start">
            <NavigationMenuList className="justify-start gap-1">
                {navLinks.map((link) => (
                    <NavigationMenuNavItem
                        key={link.label}
                        link={link}
                        inDrawer={inDrawer}
                        onNavClick={onNavClick}
                    />
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    );
};
