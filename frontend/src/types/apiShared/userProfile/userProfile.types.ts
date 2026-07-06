export type FlowCategorySummary = {
    total: number;
    completed: number;
};

export type FlowSummary = {
    REPORTABLE?: FlowCategorySummary;
    MANDATORY?: FlowCategorySummary;
    OPTIONAL?: FlowCategorySummary;
    [key: string]: FlowCategorySummary | undefined;
};

export interface IPastReport {
    test_id: string;
    total_tests?: number;
    passed_tests?: number;
    flow_summary?: FlowSummary;
    createdAt: string;
    updatedAt: string;
    domain?: string;
    version?: string;
    env?: string;
    npType?: string;
    np_type?: string;
    subscriberUrl?: string;
    subscriber_url?: string;
    usecaseId?: string;
    usecase_id?: string;
    configName?: string;
    config_name?: string;
}
