export interface ICreateLoadTestSessionParams {
    bppId: string;
    bppUri: string;
}

export interface ICreateLoadTestSessionResponse {
    id: string;
    created_at: string;
    expires_at: string;
    status: string;
}
