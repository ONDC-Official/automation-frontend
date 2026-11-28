/** FD (ONDC:FIS14:FD) runs on its own workbench; its sessions open on the FD pages, not /flow-testing. */
export const FD_DOMAIN = "ONDC:FIS14:FD";
export const isFdDomain = (domain?: string) => domain === FD_DOMAIN;
export const fdSessionPath = (sessionId: string) =>
    `/fd/session?sessionId=${encodeURIComponent(sessionId)}`;

/** The two FD roles, as the Scenario Testing role field offers them. */
export const FD_ROLE_OPTIONS = [
    { label: "Investor app (BAP)", value: "BAP" },
    { label: "Deposit issuer (BPP)", value: "BPP" },
];

export const FD_ROLE_LABEL: Record<string, string> = {
    INVESTOR_APP: "Investor app",
    DEPOSIT_ISSUER: "Deposit issuer",
};
