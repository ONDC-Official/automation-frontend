export type ApiProps = { async_predecessor: string | null; transaction_partner: string[] };

export interface ActionNodeInteraction {
    isFocused: boolean;
    isNext: boolean;
    isHistory: boolean;
    isDimmed: boolean;
    onToggleFocus: (api: string) => void;
    onHover: (api: string | null, x: number, y: number) => void;
}

export interface ActionNodeData extends Record<string, unknown>, ActionNodeInteraction {
    label: string;
    isEntry: boolean;
    isResponse: boolean;
    nextCount: number;
    historyCount: number;
}
