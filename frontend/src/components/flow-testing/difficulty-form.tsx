// src/DifficultyForm.tsx
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { inputClass } from "../ui/forms/inputClass";
import { putCacheData } from "../../utils/request-utils";
import { toast } from "react-toastify";

type Option = {
	label: string;
	value: string;
	points: number;
};

type DifficultyOption = {
	id: string;
	label: string;
	description: string;
	options: Option[];
};

const difficultyOptions: DifficultyOption[] = [
	{
		id: "stopAfterFirstNack",
		label: "Stop After First NACK",
		description:
			"Determines if the flow should stop after the first negative acknowledgment.",
		options: [
			{ label: "No", value: "no", points: 0 },
			{ label: "Yes", value: "yes", points: 20 },
		],
	},
	{
		id: "timeValidations",
		label: "Time Validations",
		description: "perform context timestamp validations.",
		options: [
			{ label: "No", value: "no", points: 0 },
			{ label: "Yes", value: "yes", points: 25 },
		],
	},
	{
		id: "protocolValidations",
		label: "Protocol Validations",
		description: "Get Nacks for breaking ondc specifications.",
		options: [
			{ label: "No", value: "no", points: 0 },
			{ label: "Yes", value: "yes", points: 30 },
		],
	},
	{
		id: "useGateway",
		label: "Use Gateway",
		description: "Use the gateway for first search",
		options: [
			{ label: "No", value: "no", points: 0 },
			{ label: "Yes", value: "yes", points: 10 },
		],
	},
	{
		id: "headerValidaton",
		label: "Header Validations",
		description: "perform header validations.",
		options: [
			{ label: "No", value: "no", points: 0 },
			{ label: "Yes", value: "yes", points: 20 },
		],
	},
];

const DifficultyForm = ({
	submitFunction,
	subUrl,
}: {
	submitFunction: () => Promise<void>;
	subUrl: string;
}) => {
	const [selections, setSelections] = useState<Record<string, string>>({});
	const [totalDifficulty, setTotalDifficulty] = useState<number>(0);

	useEffect(() => {
		const initialSelections: Record<string, string> = {};
		difficultyOptions.forEach((option) => {
			initialSelections[option.id] = "no";
		});
		setSelections(initialSelections);
	}, []);

	const handleChange = (id: string, value: string) => {
		setSelections((prev) => ({
			...prev,
			[id]: value,
		}));
	};

	useEffect(() => {
		let totalPoints = 0;
		let maxPoints = 0;

		difficultyOptions.forEach((option) => {
			const selectedOption = option.options.find(
				(opt) => opt.value === selections[option.id]
			);
			if (selectedOption) {
				totalPoints += selectedOption.points;
			}
			const maxOption = option.options.reduce((prev, current) =>
				prev.points > current.points ? prev : current
			);
			maxPoints += maxOption.points;
		});

		const difficultyPercentage =
			maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
		setTotalDifficulty(difficultyPercentage);
	}, [selections]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const final: Record<string, boolean> = {};
		Object.keys(selections).forEach((element) => {
			final[element] = selections[element] === "yes";
		});
		const dataToSend = {
			...final,
			totalDifficulty,
		};
		try {
			const response = await putCacheData({ difficulty: dataToSend }, subUrl);
			console.log("diff response", response);
			await submitFunction();
		} catch (e) {
			console.error("error while sending response", e);
			toast.error("Error while setting difficulty");
		}
		console.log(dataToSend);
	};

	return (
		<div className=" mt-2 p-2">
			<form onSubmit={handleSubmit} className="space-y-2">
				{difficultyOptions.map((option) => (
					<div key={option.id} className="flex flex-col">
						<label
							htmlFor={option.id}
							className="text-lg font-medium text-sky-700"
						>
							{option.label}
						</label>
						<p className="text-sm text-gray-500 mb-2">{option.description}</p>
						<select
							id={option.id}
							value={selections[option.id] || "no"}
							onChange={(e: ChangeEvent<HTMLSelectElement>) =>
								handleChange(option.id, e.target.value)
							}
							className={inputClass}
						>
							{option.options.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				))}

				<div className="mt-8">
					<label className="block text-lg font-medium text-gray-700 mb-2">
						Total Difficulty: {totalDifficulty}%
					</label>
					<div className="w-full bg-gray-200 rounded-full h-4">
						<div
							className="h-4 rounded-full transition-width duration-300"
							style={{
								width: `${totalDifficulty}%`,
								backgroundImage: "linear-gradient(to right, #38bdf8, #1d4ed8)", // Gradient from sky-500 to blue-900
							}}
						></div>
					</div>
				</div>

				<button
					type="submit"
					className="py-2 px-4 bg-sky-600 hover:bg-sky-700 focus:ring-blue-500 text-white text-lg font-semibold rounded-md shadow-sm transition-colors duration-300"
				>
					Submit
				</button>
			</form>
			<div className="mt-4 p-4 bg-gray-100 rounded-md border border-gray-300">
				<p className="text-sm text-gray-700">
					<strong>Note:</strong>
				</p>
				<ul className="list-disc list-inside text-sm text-gray-600 mt-2">
					<li>
						Beat all flows at minimum 50% difficulty to move from staging to
						pre-prod
					</li>
					<li>
						Beat all flows at minimum 100% difficulty to move from pre-prod to
						prod
					</li>
				</ul>
			</div>
		</div>
	);
};

export default DifficultyForm;
