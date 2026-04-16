import { useState } from "react";
import { HeaderProps } from "./types";
import { Logo } from "./Logo";
import { MobileMenuButton } from "./MobileMenuButton";
import { NavigationLinks } from "./NavigationLinks";
import { UserProfileSection } from "./UserProfileSection";
import { useHeaderLinks } from "./hooks/useHeaderLinks";
import { useDropdown } from "./hooks/useDropdown";
import { useUserDetails } from "./hooks/useUserDetails";
import { useHeaderHandlers } from "./hooks/useHeaderHandlers";

const Header = ({ onSupportClick }: HeaderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const links = useHeaderLinks();
    const { openDropdown, setOpenDropdown, dropdownRef } = useDropdown();
    const userDetails = useUserDetails();

    const {
        handleLoginClick,
        handleLinkClick,
        handleSubMenuClick,
        handleMouseEnter,
        handleMouseLeave,
    } = useHeaderHandlers({
        userDetails,
        isOpen,
        openDropdown,
        setOpenDropdown,
        setIsOpen,
        onSupportClick,
    });

    const env = import.meta.env.VITE_ENVIRONMENT;
    const isDev = env && env === "development";

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
            {isDev && (
                <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-0.5 tracking-wide uppercase">
                    {env} environment — not a production release
                </div>
            )}
            <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] max-h-20">
                <nav className="container mx-auto flex items-center justify-between px-6 h-20">
                    <Logo />

                    <MobileMenuButton isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />

                    <NavigationLinks
                        links={links}
                        isOpen={isOpen}
                        openDropdown={openDropdown}
                        dropdownRef={dropdownRef}
                        onLinkClick={handleLinkClick}
                        onSubMenuClick={handleSubMenuClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />

                    <UserProfileSection userDetails={userDetails} onLoginClick={handleLoginClick} />
                </nav>
            </div>
        </header>
    );
};

export default Header;
export type { UserDetails } from "./types";
