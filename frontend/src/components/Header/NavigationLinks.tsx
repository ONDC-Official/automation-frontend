import { useNavigate } from "react-router-dom";
import { GuideStepsEnums } from "@context/guideContext";
import GuideOverlay from "@components/ui/GuideOverlay";
import { ROUTES } from "@/constants/routes";
import { NavLink } from "./types";
import { NavLinkItem } from "./NavLinkItem";

interface NavigationLinksProps {
  links: NavLink[];
  isOpen: boolean;
  openDropdown: string | null;
  dropdownRef: React.RefObject<HTMLLIElement>;
  onLinkClick: (link: NavLink) => void;
  onSubMenuClick: (href: string) => void;
  onMouseEnter: (link: NavLink) => void;
  onMouseLeave: () => void;
}

export const NavigationLinks = ({
  links,
  isOpen,
  openDropdown,
  dropdownRef,
  onLinkClick,
  onSubMenuClick,
  onMouseEnter,
  onMouseLeave,
}: NavigationLinksProps) => {
  const navigate = useNavigate();

  return (
    <ul
      className={`${
        isOpen
          ? "absolute top-16 left-0 right-0 bg-white p-4 md:static flex flex-col md:flex-row"
          : "hidden md:flex md:flex-row"
      } space-x-6`}>
      {links.map((link, index) => (
        <GuideOverlay
          key={index}
          currentStep={link.href === ROUTES.SCENARIO ? GuideStepsEnums.Test1 : GuideStepsEnums.Skip}
          instruction="Step 4: Start Testing"
          handleGoClick={() => navigate(link.href)}
          left={0}
          top={45}>
          <NavLinkItem
            link={link}
            isOpen={isOpen}
            openDropdown={openDropdown}
            dropdownRef={dropdownRef}
            onLinkClick={onLinkClick}
            onSubMenuClick={onSubMenuClick}
            onMouseEnter={() => !isOpen && link.subMenu && onMouseEnter(link)}
            onMouseLeave={() => !isOpen && link.subMenu && onMouseLeave()}
          />
        </GuideOverlay>
      ))}
    </ul>
  );
};
