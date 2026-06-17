import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuTrigger,
} from "@/components/Shadcn/NavigationMenu/navigation-menu";
import { NavigationMenuNavLink } from "@components/Header/NavigationMenuNavLink";
import { INavigationMenuNavItem } from "@components/Header/types";

export const NavigationMenuNavItem = ({
    link,
    inDrawer = false,
    onNavClick,
}: INavigationMenuNavItem) => {
    if (link.subMenu) {
        return (
            <NavigationMenuItem>
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
        );
    }

    return (
        <NavigationMenuItem>
            <NavigationMenuNavLink
                to={link.href ?? ""}
                onClick={() => onNavClick(link)}
                closeDrawer={inDrawer}
            >
                {link.label}
            </NavigationMenuNavLink>
        </NavigationMenuItem>
    );
};
