export interface IStop {
    id: string;
    type: string;
    location?: {
        descriptor?: {
            name?: string;
            code?: string;
        };
        gps?: string;
    };
}

export interface IFulfillment {
    id: string;
    type: string;
    stops?: IStop[];
}

export interface IOnSearchPayload {
    context: Record<string, unknown>;
    message: {
        catalog: {
            providers: Array<{
                fulfillments: IFulfillment[];
            }>;
        };
    };
}

export interface ITrv11Metro210EndStopUpdateFormProps {
    submitEvent: (data: {
        jsonPath: Record<string, string | number>;
        formData: Record<string, string>;
    }) => Promise<void>;
}
