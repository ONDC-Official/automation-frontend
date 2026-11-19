import { type SVGProps } from "react";

/** A shopping bag: Workbench acting as a buyer. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const ShoppingBagIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="515.666 174.665 28.669 28.669"
            width={29}
            height={29}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M535.334 186.333C535.334 187.747 534.772 189.104 533.772 190.104C532.772 191.104 531.415 191.666 530.001 191.666C528.586 191.666 527.23 191.104 526.229 190.104C525.229 189.104 524.667 187.747 524.667 186.333M518.137 181.044H541.863M518.534 180.288C518.188 180.75 518.001 181.311 518.001 181.888V199.667C518.001 200.374 518.282 201.053 518.782 201.553C519.282 202.053 519.96 202.334 520.667 202.334H539.334C540.041 202.334 540.72 202.053 541.22 201.553C541.72 201.053 542.001 200.374 542.001 199.667V181.888C542.001 181.311 541.814 180.75 541.467 180.288L538.801 176.732C538.552 176.401 538.23 176.132 537.86 175.947C537.49 175.762 537.081 175.665 536.667 175.665H523.334C522.92 175.665 522.512 175.762 522.141 175.947C521.771 176.132 521.449 176.401 521.201 176.732L518.534 180.288Z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default ShoppingBagIcon;
