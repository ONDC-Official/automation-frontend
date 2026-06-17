import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/Shadcn/Chart/chart";
import { cn } from "@/lib/utils";

const chartConfig = {
    progress: {
        label: "Progress",
        color: "var(--color-alert-500)",
    },
} satisfies ChartConfig;

export type IRadialProgressChartProps = {
    value: number;
    size?: number;
    color?: string;
    centerTextColor?: string;
    className?: string;
};

export const RadialProgressChart = ({
    value,
    size = 72,
    color = "var(--color-alert-500)",
    centerTextColor = "var(--color-n-700)",
    className,
}: IRadialProgressChartProps) => {
    const pct = Math.min(100, Math.max(0, Math.round(value)));
    const chartData = [{ progress: pct, fill: color }];

    return (
        <div
            className={cn("relative shrink-0", className)}
            style={{ width: size, height: size }}
            aria-label={`${pct}% complete`}
        >
            <ChartContainer
                config={chartConfig}
                className="aspect-square h-full w-full [&_.recharts-radial-bar-background-sector]:fill-(--color-n-30) [&_.recharts-surface]:overflow-visible"
            >
                <RadialBarChart
                    data={chartData}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="72%"
                    outerRadius="100%"
                    barSize={6}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                        dataKey="progress"
                        background={{ fill: "var(--color-n-30)" }}
                        cornerRadius={10}
                    />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill={centerTextColor}
                                            fontSize={12}
                                            fontWeight={700}
                                        >
                                            {pct}%
                                        </text>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PolarRadiusAxis>
                </RadialBarChart>
            </ChartContainer>
        </div>
    );
};
