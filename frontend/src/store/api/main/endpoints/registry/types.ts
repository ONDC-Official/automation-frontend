export interface ISubscribeSellerParams {
    participantId: string;
    subscriberData: Record<string, unknown>;
}

export interface IUpdateSubscriberParams {
    participantId: string;
    data: Record<string, unknown>;
}

export interface IDeleteSubscriberParams {
    participantId: string;
    deleteData: Record<string, unknown>;
}

export interface IGenerateApiKeysResponse {
    signing_public_key: string;
    encryption_public_key: string;
    [key: string]: unknown;
}

export interface IRawLookupResponse {
    keys: unknown;
    locations?: { id: string; country: string[]; city: string[] }[];
    uris?: { id: string; uri: string }[];
    mappings: Record<string, unknown>[];
}
