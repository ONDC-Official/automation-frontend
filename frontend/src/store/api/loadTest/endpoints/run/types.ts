export interface IStartPreorderRunParams {
    sessionId: string;
    rps: number;
    duration: number;
}

export interface IRunStatusParams {
    sessionId: string;
    runId: string;
}

export interface PreorderResponse {
    session_id: string;
    run_id: string;
}
