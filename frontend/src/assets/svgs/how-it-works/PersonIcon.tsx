import { type SVGProps } from "react";

/** A person: Workbench acting as a seller. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const PersonIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="517.001 397.999 26 26"
            width={26}
            height={26}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M539.336 422.999V420.332C539.336 418.918 538.774 417.561 537.774 416.561C536.773 415.561 535.417 414.999 534.002 414.999H526.001C524.587 414.999 523.23 415.561 522.23 416.561C521.229 417.561 520.667 418.918 520.667 420.332V422.999M535.336 404.332C535.336 407.278 532.947 409.666 530.002 409.666C527.056 409.666 524.668 407.278 524.668 404.332C524.668 401.387 527.056 398.999 530.002 398.999C532.947 398.999 535.336 401.387 535.336 404.332Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default PersonIcon;
