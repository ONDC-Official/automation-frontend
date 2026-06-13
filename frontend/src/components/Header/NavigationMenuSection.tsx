import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/shadcn/navigation-menu";
import { navLinks } from "@components/Header/constants";
import { NavigationMenuNavLink } from "@components/Header/NavigationMenuNavLink";
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
                {navLinks.map((link) => {
                    return link.subMenu ? (
                        <NavigationMenuItem key={link.label}>
                            <NavigationMenuTrigger>{link.label}</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                {link.subMenu.map((subItem) => (
                                    <NavigationMenuNavLink
                                        key={subItem.href}
                                        to={subItem.href}
                                        closeDrawer={inDrawer}
                                    >
                                        {subItem.label}
                                    </NavigationMenuNavLink>
                                ))}
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : (
                        <NavigationMenuItem key={link.label}>
                            <NavigationMenuNavLink
                                to={link.href ?? ""}
                                onClick={() => onNavClick(link)}
                                closeDrawer={inDrawer}
                            >
                                {link.label}
                            </NavigationMenuNavLink>
                        </NavigationMenuItem>
                    );
                })}
            </NavigationMenuList>
        </NavigationMenu>
    );
};
