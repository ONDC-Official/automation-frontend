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

  const { handleLoginClick, handleLinkClick, handleSubMenuClick, handleMouseEnter, handleMouseLeave } =
    useHeaderHandlers({
      userDetails,
      isOpen,
      openDropdown,
      setOpenDropdown,
      setIsOpen,
      onSupportClick,
    });

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <nav className="container mx-auto flex items-center justify-between p-2">
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
    </header>
  );
};

export default Header;
export type { UserDetails } from "./types";
