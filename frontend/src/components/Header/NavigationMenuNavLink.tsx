import { NavLink } from "react-router-dom";
import { DrawerClose } from "@/components/shadcn/drawer";
import { NavigationMenuLink } from "@/components/shadcn/navigation-menu";
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
