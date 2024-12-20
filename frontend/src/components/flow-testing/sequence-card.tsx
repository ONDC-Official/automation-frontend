import { GoArrowSwitch } from "react-icons/go";
import { MdCheckCircle, MdError, MdHourglassEmpty } from "react-icons/md";
import { SequenceCardProps, State } from "../../types/session-types";
import { GetCurrentState } from "../../utils/flow-utils";

// Reusable StateCard component
const StateCard: React.FC<{
	data: State;
}> = ({ data }) => {
	const getStateStyles = (state: string) => {
		switch (state) {
			case "success":
				return {
					className:
						"border border-green-500 bg-white text-green-700 shadow-lg shadow-green-300/50",
					icon: <MdCheckCircle className="text-green-500 text-2xl" />,
				};
			case "error":
				return {
					className:
						"border border-red-500 bg-white text-red-700 shadow-lg shadow-red-300/50",
					icon: <MdError className="text-red-500 text-2xl" />,
				};
			case "pending":
				return {
					className:
						"border border-yellow-500 bg-white text-yellow-700 shadow-lg shadow-yellow-300/50",
					icon: <MdHourglassEmpty className="text-yellow-500 text-2xl" />,
				};
			case "inactive":
			default:
				return {
					className:
						"border border-gray-300 bg-white text-gray-700 shadow-lg shadow-gray-300/50",
					icon: null,
				};
		}
	};

	const index = data.stepIndex - 1;

	data.state = GetCurrentState(
		index,
		data.cachedData.session_payloads[data.flowId],
		data.flowId,
		data.cachedData.current_flow_id || ""
	);

	const styles = getStateStyles(data.state);

	return (
		<div className={`${styles.className} rounded-md p-4 flex-1 h-40 relative`}>
			{/* Loader */}
			{data.state === "pending" && (
				<div className="absolute bottom-2 right-2">
					<div className="w-7 h-7 border-2 border-t-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin"></div>
				</div>
			)}

			{/* Main Content */}
			<div className="flex items-center mb-2">
				{styles.icon}
				<h3 className={`text-lg font-semibold ml-2`}>
					{data.stepIndex}
					{"."} {data.type}
				</h3>
			</div>
			<p className="text-sm text-gray-600">{data.description}</p>
			{(data.state === "success" || data.state === "error") && (
				<button
					className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
					onClick={() => console.log(data.cachedData)}
				>
					View Request & Response
				</button>
			)}
		</div>
	);
};

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
