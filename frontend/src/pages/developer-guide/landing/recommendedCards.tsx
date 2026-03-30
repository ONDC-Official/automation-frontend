import { FiBook, FiKey } from "react-icons/fi";

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
        icon: <FiBook className="text-sky-600" size={20} />,
    },
    {
        id: RECOMMENDED_CARD_IDS.AUTH_TOOLS,
        title: "Auth Tools",
        subtitle: "Generate & Verify ONDC Headers",
        description:
            "Generate and verify ONDC authorization headers using BLAKE-512 hashing and Ed25519 signing.",
        icon: <FiKey className="text-sky-600" size={20} />,
    },
];
