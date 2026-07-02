import { FormConfigType } from "@/components/ui/forms/config-form";

export interface IFlowResponse {
    inputs?: FormConfigType;
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
