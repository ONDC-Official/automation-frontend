import type { IDomain } from "@/types/domain";
import type { Flow } from "@/types/flow-types";

export interface IScenarioFormDataResponse {
    domain: IDomain[];
}

export interface IReportingStatusParams {
    domain: string;
    version: string;
}

export interface IGetFlowsParams {
    domain: string;
    version: string;
    usecase: string;
}

export interface IGetFlowsResponse {
    data: { flows: Flow[] };
}
