import type { FC } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";
import type { ChangeKind } from "../types";
import { IconEdit } from "../shared/icons";

export const KIND_CONFIG: Record<
    ChangeKind,
    {
        label: string;
        icon: FC<{ size?: number; className?: string }>;
        color: string;
        bg: string;
        border: string;
    }
> = {
    added: {
        label: "Added",
        icon: FiPlus,
        color: "text-[#3F7F3F]",
        bg: "bg-[#DDEBDD]",
        border: "",
    },
    removed: {
        label: "Removed",
        icon: FiMinus,
        color: "text-[#DC2626]",
        bg: "bg-[#FCE7EA]",
        border: "",
    },
    modified: {
        label: "Modified",
        icon: IconEdit,
        color: "text-[#B45309]",
        bg: "bg-[#FDF3D6]",
        border: "",
    },
};
