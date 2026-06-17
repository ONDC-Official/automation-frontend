import { NavLink } from "react-router-dom";
import { DrawerClose } from "@/components/Shadcn/Drawer/drawer";
import { NavigationMenuLink } from "@/components/Shadcn/NavigationMenu/navigation-menu";
import { INavigationMenuNavLink } from "@components/Header/types";

export const NavigationMenuNavLink = ({
    to,
    children,
    onClick,
    closeDrawer = false,
}: INavigationMenuNavLink) => {
    const navLink = (
        <NavLink to={to} onClick={onClick}>
            {children}
        </NavLink>
    );

    return (
        <NavigationMenuLink asChild>
            {closeDrawer ? <DrawerClose asChild>{navLink}</DrawerClose> : navLink}
        </NavigationMenuLink>
    );
};
