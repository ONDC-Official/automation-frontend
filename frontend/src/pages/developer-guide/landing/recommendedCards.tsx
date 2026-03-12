import { FaBook, FaKey } from "react-icons/fa";

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
        description: "New to the developer guide? Start with a use case and explore the flow.",
        icon: <FaBook className="text-sky-600 text-4xl" />,
    },
    {
        id: RECOMMENDED_CARD_IDS.AUTH_TOOLS,
        title: "Auth Tools",
        subtitle: "Generate & Verify ONDC Headers",
        description: "Generate and verify ONDC authorization headers (BLAKE-512, Ed25519).",
        icon: <FaKey className="text-sky-600 text-4xl" />,
    },
];
