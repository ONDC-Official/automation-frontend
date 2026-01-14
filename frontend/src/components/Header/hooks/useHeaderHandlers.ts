import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@utils/analytics";
import { ROUTES } from "@constants/routes";
import { NavLink, UserDetails } from "@components/Header/types";

interface UseHeaderHandlersProps {
  userDetails: UserDetails | undefined;
  isOpen: boolean;
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
  setIsOpen: (value: boolean) => void;
  onSupportClick: () => void;
}

export const useHeaderHandlers = ({
  userDetails,
  isOpen,
  openDropdown,
  setOpenDropdown,
  setIsOpen,
  onSupportClick,
}: UseHeaderHandlersProps) => {
  const navigate = useNavigate();

  const handleLoginClick = useCallback(() => {
    if (userDetails) {
      trackEvent({
        category: "NAV",
        action: "Clicked on profile",
        label: "PROFILE",
      });
    } else {
      trackEvent({
        category: "NAV",
        action: "Clicked on Login",
        label: "LOGIN",
      });
    }
    setIsOpen(false);
    navigate(userDetails ? ROUTES.PROFILE : ROUTES.LOGIN);
  }, [userDetails, navigate, setIsOpen]);

  const handleLinkClick = useCallback(
    (link: NavLink) => {
      if (link?.analytics) {
        trackEvent(link.analytics);
      }

      if (link.label === "Support") {
        onSupportClick();
      } else if (link.subMenu) {
        navigate(link.href);
        if (isOpen) {
          setOpenDropdown(openDropdown === link.label ? null : link.label);
        }
      } else {
        navigate(link.href);
      }
    },
    [isOpen, openDropdown, navigate, onSupportClick, setOpenDropdown]
  );

  const handleSubMenuClick = useCallback(
    (href: string) => {
      navigate(href);
      setOpenDropdown(null);
      setIsOpen(false);
    },
    [navigate, setOpenDropdown, setIsOpen]
  );

  const handleMouseEnter = useCallback(
    (link: NavLink) => {
      if (link.subMenu) {
        setOpenDropdown(link.label);
      }
    },
    [setOpenDropdown]
  );

  const handleMouseLeave = useCallback(() => {
    setOpenDropdown(null);
  }, [setOpenDropdown]);

  return {
    handleLoginClick,
    handleLinkClick,
    handleSubMenuClick,
    handleMouseEnter,
    handleMouseLeave,
  };
};
