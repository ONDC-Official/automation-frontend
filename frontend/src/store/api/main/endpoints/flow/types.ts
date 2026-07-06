// Raw shape of a single form field descriptor as returned by the API. The UI-specific
// `FormConfigType` (widget variants, RJSF schema, etc.) is owned by the form renderer,
// not the API layer — callers cast into it at the point of consumption.
export type IFlowFormFieldConfig = Record<string, unknown>;

export interface IFlowResponse {
    inputs?: IFlowFormFieldConfig[];
    // Playground mock returns these from /flows/proceed (actUponFlow → sendSuccess). HTTP is
    // always 200, so callers must inspect `success` to know whether the action actually dispatched.
    success?: boolean;
    message?: string;
    jobIds?: string[];
    [key: string]: unknown;
}

export interface IActionsResponse {
    actions: string[];
}

export interface RouteResponse {
    geometry: [number, number][]; // [lat, lng] points, road-following
    distance: number; // metres
    duration: number; // seconds
}

export interface GeocodeResult {
    name: string;
    lat: number;
    lng: number;
}
