export interface IUser {
    githubId: string;
    participantId: string;
    avatarUrl?: string;
    /** Stable key for sessions and reports: GitHub login, or the ONDC user ID for ONDC logins. */
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    authProvider?: string;
    organisationId?: string;
    organisationName?: string;
    /** ONDC logins only: what NP Portal sent at the last login. */
    ondcUserId?: number;
    ondcStatus?: number;
    organisations?: IUserOrganisation[];
    lastLoginAt?: string;
}

export interface IUserOrganisation {
    organisationId: string;
    organisationName: string;
    networkStatus: string;
    participantId?: string;
    npType: string;
    isRepresentative: boolean;
    status: number;
    subscriberIds: string[];
    /** NP Portal registrations sent at the last login, as sent (not translated). */
    configs?: IUserOrganisationConfig[];
}

/** One NP Portal registration: subscriber URL + role + domain + version + use case. */
export interface IUserOrganisationConfig {
    environmentAccessId?: string;
    environment?: string;
    status?: string;
    requestType?: string;
    subscriberId?: string;
    subscriberUrl?: string;
    domain?: string;
    version?: string;
    usecase?: string;
    npType?: string;
}

/** Name to show people: first + last name when known, else the username. */
export const getUserDisplayName = (user?: IUser): string | undefined => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.username;
};
