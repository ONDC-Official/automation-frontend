import { type SVGProps } from "react";

/** A magnifier in a frame: the search action. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const SearchActionIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="107.5 428.5 17 17"
            width={17}
            height={17}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M119.75 441.583L122.667 444.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path
                    d="M121 437.833C121 435.072 118.761 432.833 116 432.833C113.239 432.833 111 435.072 111 437.833C111 440.595 113.239 442.833 116 442.833C118.761 442.833 121 440.595 121 437.833Z"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path
                    d="M122.471 434.5C122.879 434.331 123.204 434.006 123.373 433.598C123.5 433.292 123.5 432.777 123.5 432C123.5 431.223 123.5 430.835 123.373 430.529C123.204 430.12 122.879 429.796 122.471 429.627C122.165 429.5 121.777 429.5 121 429.5H111C110.223 429.5 109.835 429.5 109.529 429.627C109.12 429.796 108.796 430.12 108.627 430.529C108.5 430.835 108.5 431.223 108.5 432C108.5 432.777 108.5 433.292 108.627 433.598C108.796 434.006 109.12 434.331 109.529 434.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default SearchActionIcon;
