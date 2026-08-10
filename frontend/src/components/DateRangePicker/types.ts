export interface IRange {
    /** ISO date `YYYY-MM-DD`, or undefined for an open lower bound */
    from?: string;
    /** ISO date `YYYY-MM-DD`, or undefined for an open upper bound */
    to?: string;
}

export interface IProps {
    value: IRange;
    onChange: (range: IRange) => void;
    disabled?: boolean;
    className?: string;
}
