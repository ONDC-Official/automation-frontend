import { createContext } from "react";

export type ApiProps = { async_predecessor: string | null; transaction_partner: string[] };

export interface GraphCtxValue {
    focused: string | null;
    toggleFocus: (api: string) => void;
    onHover: (api: string | null, x: number, y: number) => void;
    actionMap: Record<string, string[]>;
    apiProperties: Record<string, ApiProps>;
    entryPoints: Set<string>;
}

export const GraphCtx = createContext<GraphCtxValue>(null!);
