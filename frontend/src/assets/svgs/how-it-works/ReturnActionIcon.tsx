import { type SVGProps } from "react";

/** A box with a return arrow: the return action. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const ReturnActionIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="107.5 478.5 17 17"
            width={17}
            height={17}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M108.5 487.833V483.667H123.5V487.833C123.5 490.976 123.5 492.547 122.524 493.524C121.547 494.5 119.976 494.5 116.833 494.5H115.167C112.024 494.5 110.453 494.5 109.476 493.524C108.5 492.547 108.5 490.976 108.5 487.833Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
                <path
                    d="M108.5 483.667L109.221 482.064C109.78 480.821 110.06 480.2 110.627 479.85C111.194 479.5 111.921 479.5 113.375 479.5H118.625C120.079 479.5 120.806 479.5 121.373 479.85C121.94 480.2 122.22 480.821 122.779 482.064L123.5 483.667"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path d="M116 483.667V479.5" strokeLinecap="round" stroke="currentColor" />
                <path
                    d="M113.083 488.25H117.667C118.587 488.25 119.333 488.996 119.333 489.917C119.333 490.837 118.587 491.583 117.667 491.583H116.833M114.333 486.583L112.667 488.25L114.333 489.917"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default ReturnActionIcon;
