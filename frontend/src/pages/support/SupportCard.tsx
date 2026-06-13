import { FC } from "react";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/shadcn/card";
import type { ISupportChannelCard } from "@pages/support/types";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

const SupportCard: FC<{ card: ISupportChannelCard }> = ({ card }) => (
    <Card variant="default" className="h-full">
        <CardHeader className="gap-0 p-0">
            <p className={`text-caption-1 font-semibold mb-4 ${card.eyebrowClassName}`}>
                {card.eyebrow}
            </p>
            <CardTitle className="mb-4">{card.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
            <ul className="space-y-3 mb-6">
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
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-n-20 dark:bg-n-800 px-3 py-4">
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
        </CardContent>
        <CardFooter className="mt-6 p-0">
            <Button asChild className={card.ctaClassName}>
                <a
                    href={card.ctaHref}
                    target={card.ctaExternal ? "_blank" : undefined}
                    rel={card.ctaExternal ? "noopener noreferrer" : undefined}
                >
                    {card.ctaLabel}
                </a>
            </Button>
        </CardFooter>
    </Card>
);

export default SupportCard;
