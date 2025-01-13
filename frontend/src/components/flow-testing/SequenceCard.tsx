import { GoArrowSwitch } from "react-icons/go";
import { SequenceCardProps } from "../../types/session-types";
import { StateCard } from "./stateCard";

// SequenceCard remains unchanged
export default function SequenceCard({ step, pair }: SequenceCardProps) {
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
