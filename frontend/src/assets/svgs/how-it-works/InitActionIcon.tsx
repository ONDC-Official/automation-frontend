import { type SVGProps } from "react";

/** A box: the init action. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const InitActionIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="354.083 428.083 17.834 17.834"
            width={18}
            height={18}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M355.083 438.25V432.417H370.917V438.25C370.917 441.393 370.917 442.964 369.94 443.94C368.964 444.917 367.393 444.917 364.25 444.917H361.75C358.607 444.917 357.036 444.917 356.06 443.94C355.083 442.964 355.083 441.393 355.083 438.25Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M355.083 432.417L355.583 431.75C356.565 430.441 357.055 429.787 357.759 429.435C358.463 429.083 359.281 429.083 360.917 429.083H365.083C366.719 429.083 367.537 429.083 368.241 429.435C368.944 429.787 369.435 430.441 370.417 431.75L370.917 432.417"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M358 442H362.167M358 439.5H360.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default InitActionIcon;
