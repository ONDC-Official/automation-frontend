import { format } from "date-fns";

export const formatLastRunText = (createdAt: string | undefined, passRate: number) => {
    if (!createdAt) return `${passRate}% pass`;

    try {
        return `Last run ${format(new Date(createdAt), "d MMM")} · ${passRate}% pass`;
    } catch {
        return `${passRate}% pass`;
    }
};
