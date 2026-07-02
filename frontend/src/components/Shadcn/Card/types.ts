export interface ICardProps {
    title: string;
    description?: string;
    badgeCount?: number;
    headerAction?: React.ReactNode;
    children?: React.ReactNode;
}
