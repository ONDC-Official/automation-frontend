import { SVGProps } from "react";

const SmartPhoneGraph = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={29} height={47} fill="none" {...props}>
        <path
            fill="#1C75BC"
            d="M23.25 0h-18A5.256 5.256 0 0 0 0 5.25v36a5.256 5.256 0 0 0 5.25 5.25h18a5.256 5.256 0 0 0 5.25-5.25v-36A5.256 5.256 0 0 0 23.25 0Zm-15 30.75a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 1.5 0v6Zm9 13.5h-6a.75.75 0 0 1 0-1.5h6a.75.75 0 0 1 0 1.5Zm-3.75-13.5v-9a.75.75 0 0 1 1.5 0v9a.75.75 0 0 1-1.5 0Zm3.75-27h-6a.75.75 0 0 1 0-1.5h6a.75.75 0 0 1 0 1.5Zm4.5 27a.75.75 0 0 1-1.5 0v-15a.75.75 0 0 1 1.5 0v15Z"
        />
    </svg>
);

export default SmartPhoneGraph;
