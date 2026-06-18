import { SVGProps } from "react";

const FullScreenIcon = ({ ...props }: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        viewBox="11 11 18 18"
        {...props}
    >
        <path
            fill="currentColor"
            d="M25.893 14.641v3.214a.536.536 0 0 1-1.071 0v-1.92l-3.371 3.37a.536.536 0 1 1-.758-.757l3.371-3.371h-1.92a.536.536 0 0 1 0-1.072h3.213a.535.535 0 0 1 .536.536Zm-7.343 6.05-3.371 3.371v-1.92a.535.535 0 0 0-1.072 0v3.213a.536.536 0 0 0 .536.536h3.214a.536.536 0 0 0 0-1.071h-1.92l3.37-3.371a.536.536 0 0 0-.757-.758Z"
        />
    </svg>
);

export default FullScreenIcon;
