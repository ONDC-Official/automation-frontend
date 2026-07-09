import { Button } from "@components/Shadcn/Button";
import {
    FLOW_ACTION_OUTLINE_ICONS,
    FLOW_ACTION_SOLID_ICONS,
    FLOW_ACTION_VARIANT_STYLES,
} from "@components/DomainFlowRunner/constants";
import type { IFlowActionButtonProps } from "@components/DomainFlowRunner/types";

export const FlowActionButton = ({
    label,
    onClick,
    variant,
    disabled = false,
}: IFlowActionButtonProps) => {
    const SolidIcon = FLOW_ACTION_SOLID_ICONS[variant];
    const OutlineIcon = FLOW_ACTION_OUTLINE_ICONS[variant];

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            className={`rounded-full ${FLOW_ACTION_VARIANT_STYLES[variant]}`}
        >
            {disabled ? (
                <OutlineIcon className="size-6" aria-hidden="true" />
            ) : (
                <SolidIcon className="size-6" aria-hidden="true" />
            )}
        </Button>
    );
};
