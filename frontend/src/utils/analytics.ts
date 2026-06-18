import ReactGA from "react-ga4";
import { IGAEvent } from "@/types/analytics";

export const initGA = () => {
    ReactGA.initialize("G-JEZFPTBKF0");
};

export const trackPageView = (path: string) => {
    ReactGA.send({ hitType: "pageview", page: path });
};

export const trackEvent = ({ category, action, label, value }: IGAEvent): void => {
    if (!category || !action) return;

    ReactGA.event({
        category,
        action,
        label,
        value,
    });
};
