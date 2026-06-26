export interface SupportInfoItem {
    label: string;
    title: string;
    subtitle: string;
}

export const supportInfoItems: SupportInfoItem[] = [
    {
        label: "SUPPORT HOURS",
        title: "Mon — Fri · 10:00 AM to 6:00 PM IST",
        subtitle: "Weekend support available for planned and critical cases only",
    },
    {
        label: "RESPONSE · NORMAL",
        title: "Within 4 business hours",
        subtitle: "Raise issues via GitHub for the fastest turnaround time.",
    },
    {
        label: "RESPONSE · CRITICAL",
        title: "Within 2 business hours",
        subtitle: "Production blockers and network-wide issues are prioritised.",
    },
];

export const COMMUNITY_CALL_URL = "#";
export const ONE_ON_ONE_URL = "mailto:team@ondc.org?subject=%5BWorkbench%5D%201-on-1%20Session";
export const TICKET_URL = "https://github.com/ONDC-Official/automation-framework/issues/new";
