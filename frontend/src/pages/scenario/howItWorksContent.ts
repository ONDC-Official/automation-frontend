import type { ComponentType, SVGProps } from "react";
import {
    CheckResponsesIcon,
    FixIssuesIcon,
    InitActionIcon,
    MultipleScenariosIcon,
    RefundActionIcon,
    ReturnActionIcon,
    RunScenariosIcon,
    SearchActionIcon,
    SelectActionIcon,
    StatusActionIcon,
} from "@assets/svgs/how-it-works";

/**
 * Everything the "How it works" slides say. Change wording here; the layout lives in
 * ScenarioGuideDialog.tsx. Icons are SVGs exported from the Figma design (screens 398-400).
 */

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface IGuideFeature {
    icon: Icon;
    /** Background of the icon's tile. */
    tileClassName: string;
    title: string;
    description: string;
}

export interface IGuideAction {
    icon: Icon;
    label: string;
}

/** Slide 1: what Workbench is. */
export const GUIDE_INTRO = {
    eyebrow: "Test your APIs with",
    title: "ONDC Workbench",
    description:
        "We provide a dedicated testing suite called ONDC Workbench, where you can run scenarios, check responses and fix issues before going live.",
    tip: {
        title: "A safe place to test",
        description:
            "Workbench lets you simulate real ONDC scenarios without affecting your live environment.",
    },
    /** Shown two on top and two below the logo, in this order. */
    features: [
        {
            icon: RunScenariosIcon,
            tileClassName: "bg-brand-light dark:bg-brand-normal/15",
            title: "Run scenarios",
            description: "Test different use cases for your domain.",
        },
        {
            icon: FixIssuesIcon,
            tileClassName: "bg-violet-50 dark:bg-violet-500/15",
            title: "Identify & fix issues",
            description: "Find errors and make improvements.",
        },
        {
            icon: CheckResponsesIcon,
            tileClassName: "bg-success-50 dark:bg-success-800/30",
            title: "Check responses",
            description: "View and validate API responses in real time.",
        },
        {
            icon: MultipleScenariosIcon,
            tileClassName: "bg-alert-50 dark:bg-alert-800/30",
            title: "Test multiple scenarios",
            description: "Simulate different buyer and seller interactions.",
        },
    ] satisfies IGuideFeature[],
};

/** The ONDC actions shown on slides 2 and 3. */
export const GUIDE_ACTIONS: IGuideAction[] = [
    { icon: SearchActionIcon, label: "Search" },
    { icon: SelectActionIcon, label: "Select" },
    { icon: InitActionIcon, label: "Init" },
    { icon: ReturnActionIcon, label: "Return" },
    { icon: RefundActionIcon, label: "Refund" },
    { icon: StatusActionIcon, label: "Status" },
];

/** Slide 2: testing your own domain, from either side. */
export const GUIDE_DOMAIN = {
    eyebrow: "Test multiple scenarios for",
    title: "Your Domain",
    description:
        "Test domain-specific scenarios across Retail, Grocery, Food & Beverage, Logistics, Healthcare, and more to validate your APIs.",
    roles: {
        seller: {
            youAre: "Seller",
            title: "Workbench will act as a Buyer",
            description:
                "You can test buyer-side behaviour (search, select, place order, returns, etc.) for your domain.",
        },
        buyer: {
            youAre: "Buyer",
            title: "Workbench will act as a Seller",
            description:
                "You can test seller-side behaviour (catalog, order fulfilment, returns, etc.) for your domain.",
        },
    },
};

/** One piece of a code line: plain text, a JSON key, or a JSON string value. */
export type ICodeToken = { text: string; kind?: "key" | "value" };

/** Slide 3: the APIs every participant checks, with a sample request. */
export const GUIDE_NETWORK = {
    eyebrow: "Check all the APIs to",
    title: "Transact On ONDC Network",
    description:
        "Run and validate key APIs to ensure a smooth buyer and seller experience on the ONDC network.",
    /** The first five actions get a tick on this slide. */
    checkedActions: GUIDE_ACTIONS.slice(0, 5),
    sampleRequest: [
        [{ text: "{" }],
        [{ text: "  " }, { text: '"context"', kind: "key" }, { text: ": {" }],
        [
            { text: "    " },
            { text: '"domain"', kind: "key" },
            { text: ": " },
            { text: '"ONDC:RET10"', kind: "value" },
            { text: "," },
        ],
        [
            { text: "    " },
            { text: '"action"', kind: "key" },
            { text: ": " },
            { text: '"search"', kind: "value" },
            { text: "," },
        ],
        [
            { text: "    " },
            { text: '"version"', kind: "key" },
            { text: ": " },
            { text: '"2.0.0"', kind: "value" },
        ],
        [{ text: "  }," }],
        [{ text: "  " }, { text: '"message"', kind: "key" }, { text: ": {" }],
        [{ text: "    " }, { text: '"catalog"', kind: "key" }, { text: ": {" }],
        [{ text: "      " }, { text: '"bpp/providers"', kind: "key" }, { text: ": [ ... ]" }],
        [{ text: "    }" }],
        [{ text: "  }" }],
        [{ text: "}" }],
    ] satisfies ICodeToken[][],
};
