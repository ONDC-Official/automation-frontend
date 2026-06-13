import {
    Card as ShadCnCard,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/shadcn/card";

type CardProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
};

export const Card = ({ title, description, children }: CardProps) => (
    <ShadCnCard>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
    </ShadCnCard>
);

export default Card;
