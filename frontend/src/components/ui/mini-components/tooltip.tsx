import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Basic Tippy styles
import "tippy.js/themes/material.css"; // Optional theme
import "tippy.js/animations/perspective-subtle.css";

const CustomTooltip = ({
	content,
	children,
}: {
	content: string;
	children: any;
}) => {
	return (
		<Tippy
			content={
				<div className="p-2 text-white rounded shadow-md">{content}</div>
			}
			interactive={true}
			placement="top"
			animation="perspective-subtle"
		>
			{children}
		</Tippy>
	);
};

export default CustomTooltip;
