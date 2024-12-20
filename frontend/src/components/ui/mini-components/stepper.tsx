import React from "react";
import { FaCheck } from "react-icons/fa";

interface Step {
	icon: React.ReactElement;
	label: string;
}

interface StepperProps {
	steps: Step[];
	currentStep: number; // Zero-based index
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
	return (
		<nav aria-label="Progress">
			<ol className="relative flex justify-between items-center w-full">
				{steps.map((step, index) => {
					const isCompleted = index < currentStep;
					const isCurrent = index === currentStep;

					// Avoid rendering the connector after the last step
					const isLastStep = index === steps.length - 1;

					return (
						<li
							key={index}
							className="relative flex-1 flex items-center justify-center"
						>
							{/* Connector */}
							{!isLastStep && (
								<div
									className={`absolute top-1/2 left-1/2 transform -translate-y-1/2 w-full
                    ${isCompleted ? "bg-sky-700" : "bg-gray-300"} h-0.5`}
								></div>
							)}

							{/* Step Indicator */}
							<div className="flex flex-col items-center z-10">
								<div
									className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300
                    ${
											isCompleted
												? "bg-sky-700 text-white"
												: isCurrent
												? "bg-white border-sky-500 text-sky-500"
												: "bg-white border-gray-300 text-gray-500"
										}`}
								>
									{isCompleted ? <FaCheck className="w-4 h-4" /> : step.icon}
								</div>

								{/* Label */}
								{/* <span
									className={`mt-2 text-sm text-center
                    ${
											isCompleted
												? "text-sky-700"
												: isCurrent
												? "text-sky-500"
												: "text-gray-500"
										}`}
								>
									{step.label}
								</span> */}
							</div>
						</li>
					);
				})}
			</ol>
		</nav>
	);
};

export default Stepper;
