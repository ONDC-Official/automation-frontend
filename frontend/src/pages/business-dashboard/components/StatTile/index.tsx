import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Card, { CardContent } from "@pages/business-dashboard/components/Card";
import { cn } from "@pages/business-dashboard/lib/utils";
import { statDeltaVariants, statValueVariants } from "./variants";
import type { IProps } from "./types";

const SPARK_WIDTH = 96;
const SPARK_HEIGHT = 24;

function sparkPoints(trend: number[]) {
    if (trend.length < 2) return "";
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const span = max - min || 1;

    return trend
        .map((point, index) => {
            const x = (index / (trend.length - 1)) * SPARK_WIDTH;
            const y = SPARK_HEIGHT - ((point - min) / span) * SPARK_HEIGHT;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
}

const StatTile = ({
    label,
    value,
    hint,
    icon: Icon,
    tone,
    delta,
    trend,
    isLoading,
    className,
}: IProps) => {
    const direction = delta
        ? delta.value === 0
            ? "flat"
            : delta.value > 0 === (delta.upIsGood ?? true)
              ? "up"
              : "down"
        : "flat";

    const DeltaIcon =
        delta === undefined || delta.value === 0
            ? Minus
            : delta.value > 0
              ? TrendingUp
              : TrendingDown;

    return (
        <Card data-slot="stat-tile" className={cn("gap-3", className)}>
            <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">{label}</p>
                    {Icon && <Icon className="text-muted-foreground size-4" />}
                </div>

                {isLoading ? (
                    <div className="bg-muted h-7 w-24 animate-pulse rounded" />
                ) : (
                    <p className={cn(statValueVariants({ tone }))}>{value}</p>
                )}

                <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        {delta && (
                            <span className={cn(statDeltaVariants({ direction }))}>
                                <DeltaIcon className="size-3.5" />
                                {delta.value > 0 ? "+" : ""}
                                {delta.value.toFixed(1)}%
                                <span className="text-muted-foreground font-normal">
                                    {delta.period}
                                </span>
                            </span>
                        )}
                        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
                    </div>

                    {trend && trend.length > 1 && (
                        <svg
                            viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
                            width={SPARK_WIDTH}
                            height={SPARK_HEIGHT}
                            className="shrink-0 overflow-visible"
                            aria-hidden="true"
                        >
                            <polyline
                                points={sparkPoints(trend)}
                                fill="none"
                                stroke="var(--chart-1)"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatTile;
