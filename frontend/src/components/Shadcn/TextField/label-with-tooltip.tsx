import React from "react";

export interface ILabelWithToolTipProps {
    label: string;
    labelInfo?: string;
    required?: string | boolean;
}

export const LabelWithToolTip = ({ label, required }: ILabelWithToolTipProps) => (
    <div className="flex justify-between w-full">
        <span className="text-sm font-semibold text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
        </span>
    </div>
);

export const LabelToolTip = ({ label }: { label: string }) => {
    const formattedLabelInfo = label.split("\n").map((line, index) => (
        <React.Fragment key={index}>
            {line}
            <br />
        </React.Fragment>
    ));

    return (
        <div className="relative max-w-xs rounded-md border border-border bg-muted p-2 pr-8 text-center text-sm font-semibold shadow-lg backdrop-blur-lg">
            <p className="mb-1 ml-3 text-foreground">{formattedLabelInfo}</p>
        </div>
    );
};
