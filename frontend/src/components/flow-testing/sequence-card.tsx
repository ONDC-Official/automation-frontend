import React, { useState, useEffect } from "react";
import { GoArrowSwitch } from "react-icons/go";
import { MdCheckCircle, MdError, MdHourglassEmpty } from "react-icons/md";
import { SequenceCardProps, State } from "../../types/session-types";
import { GetCurrentState, getRequestResponse } from "../../utils/flow-utils";
import "../../styles/animation.css";
import CustomTooltip from "../ui/mini-components/tooltip";
import { IoMdSettings } from "react-icons/io";
// Reusable StateCard component with CSS-based animation
const StateCard: React.FC<{
	data: State;
}> = ({ data }) => {
	const [animate, setAnimate] = useState(false);
	const [prevState, setPrevState] = useState(data.state);

	const getStateStyles = (state: string) => {
		switch (state) {
			case "success":
				return {
					className:
						"border border-green-500 bg-white text-green-700 shadow-lg shadow-green-300/50",
					icon: <MdCheckCircle className="text-green-500 text-2xl" />,
					color: "green",
				};
			case "error":
				return {
					className:
						"border border-red-500 bg-white text-red-700 shadow-lg shadow-red-300/50",
					icon: <MdError className="text-red-500 text-2xl" />,
					color: "red",
				};
			case "pending":
				return {
					className:
						"border border-yellow-500 bg-white text-yellow-700 shadow-lg shadow-yellow-300/50",
					icon: <MdHourglassEmpty className="text-yellow-500 text-2xl" />,
					color: "yellow",
				};
			case "inactive":
			default:
				return {
					className:
						"border border-gray-300 bg-white text-gray-700 shadow-lg shadow-gray-300/50",
					icon: null,
					color: "gray",
				};
		}
	};

	const index = data.stepIndex - 1;

	// Update the state based on current flow
	data.state = GetCurrentState(
		index,
		data.cachedData.session_payloads[data.flowId],
		data.flowId,
		data.cachedData.current_flow_id || ""
	);

	const styles = getStateStyles(data.state);

	// Detect state changes to trigger animation
	useEffect(() => {
		if (prevState !== data.state) {
			setAnimate(true);
			const timer = setTimeout(() => {
				setAnimate(false);
			}, 300); // Duration should match the CSS animation duration

			setPrevState(data.state);

			return () => clearTimeout(timer);
		}
	}, [data.state, prevState]);

	const handleClick = () => {
		console.log("Clicked");
		data.setSideView(
			getRequestResponse(
				index,
				data.cachedData.session_payloads[data.flowId],
				data.type
			)
		);
	};

	return (
		<CustomTooltip content={data.description}>
			<button
				className={`${animate ? "animate-pop" : ""} ${
					styles.className
				} rounded-md p-2 w-full flex items-center justify-between relative transition-transform duration-300 ease-in-out transform hover:bg-slate-50`}
				onClick={() => handleClick()}
			>
				<div className="flex items-center space-x-2">
					{styles.icon}
					<h3 className="text-md font-semibold">{`${data.stepIndex}. ${data.type}`}</h3>
					{data.state === "pending" && (
						<div className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin-slow ml-2"></div>
					)}
				</div>
				<IoMdSettings className="text-lg" />
			</button>
		</CustomTooltip>
	);
};

// SequenceCard remains unchanged
function SequenceCard({ step, pair }: SequenceCardProps) {
	return (
		<div className="flex items-center space-x-4 bg-white p-1">
			{/* Step Card */}
			<StateCard data={step} />

			{/* Separator Icon */}
			{pair && (
				<div className="flex flex-col items-center">
					<GoArrowSwitch className="text-2xl text-gray-500 my-2" />
				</div>
			)}

			{/* Pair Card */}
			{pair && <StateCard data={pair} />}
		</div>
	);
}

export default SequenceCard;
