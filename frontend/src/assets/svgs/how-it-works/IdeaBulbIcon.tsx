import { type SVGProps } from "react";

/** A light bulb: a tip. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const IdeaBulbIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="107.5 427.5 21 21"
            width={21}
            height={21}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M114 442.5C112.773 441.401 112 439.777 112 438C112 434.686 114.686 432 118 432C121.314 432 124 434.686 124 438C124 439.777 123.227 441.401 122 442.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path
                    d="M118 438V442.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M115.5 445H120.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M116.5 447.5H119.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M109.5 438H108.5M111.984 431.976L111.234 431.23M124.02 431.976L124.77 431.23M127.5 438H126.5M118 428.5V429.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default IdeaBulbIcon;
