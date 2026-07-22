import { ISupportChannelCard, ISupportHowItWorksStep } from "@pages/support/types";
import {
    COMMUNITY_CALL_URL,
    FIS_CALL_URL,
    MOBILITY_TRV_CALL_URL,
    RETAIL_LOGISTIC_CALL_URL,
    TICKET_URL,
} from "@constants/support";

export const supportChannelCards: ISupportChannelCard[] = [
    {
        key: "raise-ticket",
        eyebrow: "Tracked issue with SLA guarantee",
        eyebrowClassName: "text-error-500",
        title: "Raise a Ticket",
        features: [
            "Log bugs and feature requests on GitHub Issues",
            "SLA-backed response for normal and critical severities",
            "Include session ID and payload for faster triage",
            "Track status and updates in one place",
        ],
        stats: [{ label: "Platform", value: "GitHub" }],
        ctas: [
            {
                label: "Raise a New Ticket",
                href: TICKET_URL,
                external: true,
                className: "w-full bg-error-500 text-n-0 hover:bg-error-800 hover:text-n-0",
            },
        ],
    },
    {
        key: "one-on-one",
        eyebrow: "Private session with integration team",
        eyebrowClassName: "text-brand-normal",
        title: "1-on-1 Call",
        features: [
            "Dedicated 15-minute session with integration engineers",
            "Screen-share your payload, flows, or error logs",
            "Best for staging bugs and certification blockers",
            "Book via email with your domain and NP ID",
        ],
        stats: [
            { label: "Duration", value: "15 min" },
            { label: "Format", value: "Meet" },
            { label: "Response", value: "24 hrs" },
        ],
        ctas: [
            {
                label: "Retail/Logistics",
                href: RETAIL_LOGISTIC_CALL_URL,
                external: true,
                className:
                    "w-full bg-brand-normal text-n-0 hover:bg-brand-normal-hover hover:text-n-0",
            },
            {
                label: "Mobility/Travel/Tourism",
                href: MOBILITY_TRV_CALL_URL,
                external: true,
                className:
                    "w-full bg-brand-normal text-n-0 hover:bg-brand-normal-hover hover:text-n-0",
            },
            {
                label: "Financial Services",
                href: FIS_CALL_URL,
                external: true,
                className:
                    "w-full bg-brand-normal text-n-0 hover:bg-brand-normal-hover hover:text-n-0",
            },
        ],
    },
    {
        key: "community-call",
        eyebrow: "Open to all network participants",
        eyebrowClassName: "text-success-500",
        title: "Community Call",
        features: [
            "Bi-weekly open sessions for all network participants",
            "Live Q&A with the ONDC integration team",
            "Covers schema, flows, certification, and go-live",
            "Recordings shared after each session",
        ],
        stats: [
            { label: "Time", value: "10:00 AM - 11:00 AM" },
            { label: "Format", value: "Google Meet" },
        ],
        ctas: [
            {
                label: "Join Next Community Call",
                href: COMMUNITY_CALL_URL,
                external: true,
                className: "w-full bg-success-500 text-n-0 hover:bg-green-600 hover:text-n-0",
            },
        ],
    },
];

export const supportHowItWorksSteps: ISupportHowItWorksStep[] = [
    {
        number: "1",
        eyebrow: "// CHOOSE",
        title: "Pick Your Channel",
        description: "Choose community call, 1-on-1 session, or raise a ticket based on urgency.",
    },
    {
        number: "2",
        eyebrow: "// DESCRIBE",
        title: "Share the Context",
        description: "Describe your domain, payload, or error with as much detail as possible.",
    },
    {
        number: "3",
        eyebrow: "// RESOLVE",
        title: "Get Unblocked",
        description: "Our team responds within SLA and helps you move forward.",
    },
];
