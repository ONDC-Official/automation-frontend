import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import { NavLink } from "@components/Header/types";
import { navLinks } from "@components/Header/constants";

export const useHeaderLinks = () => {
  const [links, setLinks] = useState<NavLink[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;

  useEffect(() => {
    if (pathName === ROUTES.ROOT) {
      setLinks(navLinks);
      navigate(ROUTES.HOME);
    } else {
      const modifiedLinks: NavLink[] = navLinks.map((link) => {
        const isMainLinkSelected = link.href === pathName;
        const isSubMenuSelected = link.subMenu?.some((sub) => sub.href === pathName);
        return {
          ...link,
          selected: isMainLinkSelected || isSubMenuSelected || false,
        };
      });

      setLinks(modifiedLinks);
    }
  }, [pathName, navigate]);

  return links;
};
