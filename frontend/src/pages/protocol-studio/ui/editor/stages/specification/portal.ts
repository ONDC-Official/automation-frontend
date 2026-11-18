import { createContext, useContext } from "react";

/** The editor root: menus and popovers portal into it, so they keep the Studio theme. */
export const SpecPortalContext = createContext<HTMLElement | null>(null);

export const useSpecPortal = () => useContext(SpecPortalContext);
