import { ReactNode } from "react";

export type CollapsibleSectionProps = {
    title: string;
    defaultOpen?: boolean;
    children: ReactNode;
    headerActions?: ReactNode;
    className?: string;
};

export type InfoPillProps = {
    label: string;
    value: string;
    copyable?: boolean;
};

export type FlowActionButtonProps = {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    variant: "play" | "stop" | "delete" | "download";
    disabled?: boolean;
};

export type EndpointsSectionProps = {
    sendUrl: string;
    receiveUrl: string;
};

export type InfoSectionProps = {
    data: Record<string, string>;
    headerActions?: ReactNode;
    pollingIndicator?: ReactNode;
};
