import { useId, type SVGProps } from "react";

/** A purple wrench: identify and fix issues. Keeps the design's own colours. From the Figma "How it works" screens. */
const FixIssuesIcon = (props: SVGProps<SVGSVGElement>) => {
    const uid = useId();
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="805 116.5 30 30"
            width={30}
            height={30}
            fill="none"
            aria-hidden="true"
            {...props}
        >
            <defs>
                <clipPath id={`${uid}-0`}>
                    <rect width="30" height="30" fill="white" transform="translate(805 116.5)" />
                </clipPath>
            </defs>
            <g clipPath={`url(#${uid}-0)`}>
                <g>
                    <g>
                        <path
                            d="M834.403 121.832C834.293 121.555 834.051 121.351 833.759 121.291C833.467 121.23 833.164 121.321 832.953 121.532L828.383 126.102L825.926 125.574L825.398 123.117L829.968 118.547C830.179 118.336 830.27 118.033 830.209 117.741C830.149 117.449 829.945 117.207 829.668 117.096C826.531 115.852 822.961 116.59 820.575 118.976C819.427 120.125 818.638 121.568 818.294 123.148C818 124.501 818.042 125.898 818.411 127.223L806.215 139.419C805.431 140.203 805 141.244 805 142.352C805 143.46 805.431 144.502 806.215 145.285C806.998 146.069 808.04 146.5 809.148 146.5C810.256 146.5 811.297 146.069 812.081 145.285L824.277 133.089C825.602 133.458 826.999 133.5 828.352 133.206C829.932 132.862 831.375 132.073 832.524 130.925C834.91 128.539 835.648 124.969 834.403 121.832Z"
                            fill="#7F3BF7"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
};

export default FixIssuesIcon;
