import {
    Card as ShadCnCard,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/Shadcn/Card/card";
import { ICardProps } from "@/components/Shadcn/Card/types";

export const Card = ({ title, description, badgeCount, children }: ICardProps) => (
    <ShadCnCard>
        <CardHeader>
            <div className="flex items-center gap-2">
                <CardTitle>{title}</CardTitle>
                {badgeCount != null && badgeCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-brand-light text-brand-normal text-caption-1 font-semibold dark:bg-surface-muted">
                        {badgeCount}
                    </span>
                ) : null}
            </div>
            {description && <CardDescription className="pb-4">{description}</CardDescription>}
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
    </ShadCnCard>
);

export default Card;
