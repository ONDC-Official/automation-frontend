import { COMMUNITY_CALL_URL, ONE_ON_ONE_URL, TICKET_URL } from "@constants/support";
import { ISupportChannelCard, ISupportHowItWorksStep } from "@/pages/support/types";

export const supportChannelCards: ISupportChannelCard[] = [
    {
        key: "community-call",
        eyebrow: "Open to all network participants",
        eyebrowClassName: "text-brand-normal",
        title: "Community Call",
        features: [
            "Bi-weekly open sessions for all network participants",
            "Live Q&A with the ONDC integration team",
            "Covers schema, flows, certification, and go-live",
            "Recordings shared after each session",
        ],
        stats: [
            { label: "Duration", value: "60 min" },
            { label: "Format", value: "Google Meet" },
            { label: "Recording", value: "Available" },
        ],
        ctaLabel: "Join Next Community Call",
        ctaHref: COMMUNITY_CALL_URL,
        ctaExternal: true,
        ctaClassName: "w-full bg-success-500 text-n-0 hover:bg-green-600 hover:text-n-0",
    },
    {
        key: "one-on-one",
        eyebrow: "Private session with integration team",
        eyebrowClassName: "text-brand-normal",
        title: "1-on-1 Call",
        features: [
            "Dedicated 30-minute session with integration engineers",
            "Screen-share your payload, flows, or error logs",
            "Best for staging bugs and certification blockers",
            "Book via email with your domain and NP ID",
        ],
        stats: [
            { label: "Duration", value: "30 min" },
            { label: "Format", value: "Zoom / Meet" },
            { label: "Response", value: "24 hrs" },
        ],
        ctaLabel: "Book a 1-on-1 Session",
        ctaHref: ONE_ON_ONE_URL,
        ctaExternal: true,
        ctaClassName: "w-full bg-brand-normal text-n-0 hover:bg-brand-normal-hover hover:text-n-0",
    },
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
        stats: [
            { label: "Normal SLA", value: "4 hrs" },
            { label: "Critical SLA", value: "2 hrs" },
            { label: "Platform", value: "GitHub" },
        ],
        ctaLabel: "Raise a New Ticket",
        ctaHref: TICKET_URL,
        ctaExternal: true,
        ctaClassName: "w-full bg-error-500 text-n-0 hover:bg-error-800 hover:text-n-0",
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
