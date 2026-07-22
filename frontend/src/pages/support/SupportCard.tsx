import { FC } from "react";
import { Button } from "@components/Shadcn/Button";
import { Card, CardHeader, CardTitle } from "@components/Shadcn/Card/card";
import type { ISupportChannelCard } from "@pages/support/types";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const SupportCard: FC<{ card: ISupportChannelCard }> = ({ card }) => (
    <Card variant="default" className="grid! h-full row-span-5 grid-rows-subgrid gap-0">
        <CardHeader className="gap-0 p-0">
            <p className={`text-caption-1 font-semibold mb-4 ${card.eyebrowClassName}`}>
                {card.eyebrow}
            </p>
            <CardTitle className="mb-4">{card.title}</CardTitle>
        </CardHeader>

        <ul className="space-y-3">
            {card.features.map((feature) => (
                <li
                    key={feature}
                    className="flex items-start gap-2 text-body-2 text-n-500 dark:text-n-60"
                >
                    <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-brand-normal" />
                    {feature}
                </li>
            ))}
        </ul>

        <div
            className="mt-6 grid gap-3 rounded-lg bg-n-20 dark:bg-n-800 px-3 py-4"
            style={{ gridTemplateColumns: `repeat(${card.stats.length}, minmax(0, 1fr))` }}
        >
            {card.stats.map((stat) => (
                <div key={stat.label}>
                    <p className="text-caption-2 font-semibold uppercase tracking-wide text-n-300 dark:text-n-60 mb-1">
                        {stat.label}
                    </p>
                    <p className="text-caption-1 font-semibold text-n-800 dark:text-n-0">
                        {stat.value}
                    </p>
                </div>
            ))}
        </div>

        {/* Shared subgrid row — absorbs height difference between cards. */}
        <div aria-hidden="true" />

        <div className={`self-end w-full flex gap-2 ${card.ctas.length > 1 ? "flex-col" : ""}`}>
            {card.ctas.map((cta) => (
                <Button key={cta.label} asChild className={cta.className}>
                    <a
                        href={cta.href}
                        target={cta.external ? "_blank" : undefined}
                        rel={cta.external ? "noopener noreferrer" : undefined}
                    >
                        {cta.label}
                        {cta.external && <ArrowTopRightOnSquareIcon className="size-4 shrink-0" />}
                    </a>
                </Button>
            ))}
        </div>
    </Card>
);

export default SupportCard;
