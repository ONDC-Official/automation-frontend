import { type SVGProps } from "react";

/** A tick mark. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const CheckMarkIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="429.798 287.162 10.262 10.262"
            width={10}
            height={10}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M430.798 292.481L433.427 295.11L439.06 289.477"
                    strokeWidth="0.79661"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default CheckMarkIcon;
