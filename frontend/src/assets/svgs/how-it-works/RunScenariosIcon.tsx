import { useId, type SVGProps } from "react";

/** A blue play button: run scenarios. Keeps the design's own colours. From the Figma "How it works" screens. */
const RunScenariosIcon = (props: SVGProps<SVGSVGElement>) => {
    const uid = useId();
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="516 116.5 30 30"
            width={30}
            height={30}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <defs>
                <clipPath id={`${uid}-0`}>
                    <rect width="30" height="30" fill="white" transform="translate(516 116.5)" />
                </clipPath>
            </defs>
            <g clipPath={`url(#${uid}-0)`}>
                <g>
                    <g>
                        <path
                            d="M531 116.5C522.728 116.5 516 123.229 516 131.5C516 139.771 522.728 146.5 531 146.5C539.272 146.5 546 139.771 546 131.5C546 123.229 539.272 116.5 531 116.5Z"
                            fill="#198CFD"
                        />
                        <path
                            d="M528.213 137.651L536.963 132.026C537.141 131.911 537.25 131.712 537.25 131.5C537.25 131.288 537.141 131.089 536.963 130.974L528.213 125.349C528.022 125.224 527.774 125.218 527.576 125.326C527.375 125.436 527.25 125.646 527.25 125.875V137.125C527.25 137.354 527.375 137.564 527.576 137.674C527.669 137.724 527.772 137.75 527.875 137.75C527.992 137.75 528.111 137.717 528.213 137.651Z"
                            fill="white"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
};

export default RunScenariosIcon;
