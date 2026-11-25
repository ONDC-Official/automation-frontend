import { type SVGProps } from "react";

/** A chart on a board: the status action. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const StatusActionIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="353.667 477.667 18.666 18.666"
            width={19}
            height={19}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M363 492V495.333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M361.333 492L357.167 495.333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M364.667 492L368.833 495.333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M355.083 487C355.083 489.357 355.083 490.535 355.815 491.268C356.548 492 357.726 492 360.083 492H365.917C368.274 492 369.452 492 370.184 491.268C370.917 490.535 370.917 489.357 370.917 487V483.667C370.917 481.31 370.917 480.131 370.184 479.399C369.452 478.667 368.274 478.667 365.917 478.667H360.083C357.726 478.667 356.548 478.667 355.815 479.399C355.083 480.131 355.083 481.31 355.083 483.667V487Z"
                    stroke="currentColor"
                />
                <path
                    d="M359.667 487.833V485.333M363 487.833V482.833M366.333 487.833V486.167"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default StatusActionIcon;
