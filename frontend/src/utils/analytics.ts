import ReactGAImport from "react-ga4";
import { IGAEvent } from "@/types/analytics";

type GA4Instance = typeof ReactGAImport;
type ReactGAModule = GA4Instance & { default?: GA4Instance };

// react-ga4 is CJS; the GA instance can be nested under `.default` in ESM builds.
const ReactGA = (ReactGAImport as ReactGAModule).default ?? ReactGAImport;

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
