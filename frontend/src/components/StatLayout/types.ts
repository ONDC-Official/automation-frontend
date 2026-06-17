export interface IStat {
    value: string;
    title: string;
    subtitle: string;
}

export interface IStatLayoutProps {
    label: string;
    title: string;
    description: string;
    stats: IStat[];
}
