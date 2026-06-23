import { BookOpenIcon, KeyIcon } from "@heroicons/react/24/outline";

export const RECOMMENDED_CARD_IDS = {
    GETTING_STARTED: "getting-started",
    AUTH_TOOLS: "auth-tools",
} as const;

export interface RecommendedCardConfig {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
}

export const recommendedCards: RecommendedCardConfig[] = [
    {
        id: RECOMMENDED_CARD_IDS.GETTING_STARTED,
        title: "Getting Started",
        subtitle: "Start with a use case",
        description:
            "New to the developer guide? Walk through a real use case and explore all request/response flows step by step.",
        icon: <BookOpenIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
        id: RECOMMENDED_CARD_IDS.AUTH_TOOLS,
        title: "Auth Tools",
        subtitle: "Generate & Verify ONDC Headers",
        description:
            "Generate and verify ONDC authorization headers using BLAKE-512 hashing and Ed25519 signing.",
        icon: <KeyIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
];
