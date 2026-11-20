import { type SVGProps } from "react";

/** Money going back: the refund action. Drawn in currentColor, so it takes the text colour. From the Figma "How it works" screens. */
const RefundActionIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="229.667 477.667 18.666 18.666"
            width={19}
            height={19}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <g>
                <path
                    d="M239 486.166C238.079 486.166 237.333 486.725 237.333 487.415C237.333 488.104 238.079 488.663 239 488.663C239.92 488.663 240.667 489.223 240.667 489.912C240.667 490.602 239.92 491.161 239 491.161M239 486.166C239.726 486.166 240.343 486.513 240.572 486.998M239 486.166V485.333M239 491.161C238.274 491.161 237.657 490.813 237.428 490.328M239 491.161L239.002 492"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path
                    d="M246.5 486.167C246.631 486.101 246.744 486.018 246.845 485.913C247.333 485.406 247.333 484.591 247.333 482.96C247.333 481.329 247.333 480.513 246.845 480.007C246.357 479.5 245.571 479.5 244 479.5H234C232.429 479.5 231.643 479.5 231.155 480.007C230.667 480.513 230.667 481.329 230.667 482.96C230.667 484.591 230.667 485.406 231.155 485.913C231.256 486.018 231.369 486.101 231.5 486.167"
                    strokeLinecap="round"
                    stroke="currentColor"
                />
                <path
                    d="M244.833 488.667C244.833 491.888 242.222 494.5 239 494.5C235.778 494.5 233.167 491.888 233.167 488.667C233.167 485.445 235.778 482.833 239 482.833C242.222 482.833 244.833 485.445 244.833 488.667Z"
                    stroke="currentColor"
                />
                <path
                    d="M233.167 482.833H244.833"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    stroke="currentColor"
                />
            </g>
        </svg>
    );
};

export default RefundActionIcon;
