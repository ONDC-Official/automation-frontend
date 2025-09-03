import * as React from "react";
import { useEffect, useRef, useState } from "react";

interface IProps {
	title: string;
	children: React.ReactNode;
	state: boolean;
}

const SchemaGuide = ({ title, children, state }: IProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [maxHeight, setMaxHeight] = useState("0px");

	useEffect(() => {
		if (contentRef.current) {
			setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
		}
	}, [isOpen]);

	useEffect(() => {
		setIsOpen(state);
	}, [state]);

	return (
		<div>
			<div className="rounded-sm mb-4 shadow-sm w-full ml-1">
				<div
					className="flex items-center justify-between px-5 py-3 bg-white border rounded-md shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
					aria-controls={`accordion-content-${title}}`}
				>
					<h3 className="text-base font-bold text-sky-700">
						<pre>{title}:</pre>
					</h3>
				</div>

				<div
					ref={contentRef}
					id={`accordion-content-${title}`}
					className="overflow-hidden transition-all duration-300 ease-in-out"
					style={{ maxHeight: `${maxHeight}` }}
				>
					<div className="px-4 py-5 bg-white">{children}</div>
				</div>
			</div>
		</div>
	);
};

export default SchemaGuide;
