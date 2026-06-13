import { FC } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/shadcn/card";
import type { ISupportCard as SupportCardData } from "@pages/home/types";

interface SupportCardProps {
    card: SupportCardData;
}

const SupportCard: FC<SupportCardProps> = ({ card }) => {
    const { Icon } = card;
    const linkContent = (
        <span className="inline-flex items-center gap-1.5 text-brand-normal text-body-2 font-semibold group-hover:gap-2 transition-all">
            {card.linkLabel}
            <ArrowRightIcon className="size-4" />
        </span>
    );

    return (
        <Card variant="muted" className="h-full group">
            <CardHeader className="gap-0 p-0">
                <Icon
                    width={48}
                    height={48}
                    className="mb-5 h-12 w-12 shrink-0 text-brand-normal"
                />
                <CardTitle className="mb-2">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <CardDescription>{card.description}</CardDescription>
            </CardContent>
            <CardFooter className="mt-6 p-0">
                {card.external ? (
                    <a
                        href={card.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                    >
                        {linkContent}
                    </a>
                ) : (
                    <Link to={card.href} className="inline-block">
                        {linkContent}
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
};

export default SupportCard;
