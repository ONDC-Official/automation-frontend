// components/extras/statistics.tsx

import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { ValidationResult } from "../../mock-engine/code-runners/code-validator";

interface CodeStatisticsProps {
	statistics?: {
		lines: number;
		complexity: number;
		loops: number;
		conditionals: number;
	};
	validation?: ValidationResult | null;
}

export const CodeStatistics = ({
	statistics,
	validation,
}: CodeStatisticsProps) => {
	if (!statistics) return null;

	const getComplexityColor = (complexity: number) => {
		if (complexity <= 5) return "text-sky-600 bg-sky-50 border-sky-200";
		if (complexity <= 10)
			return "text-yellow-600 bg-yellow-50 border-yellow-200";
		return "text-red-600 bg-red-50 border-red-200";
	};

	const hasErrors = validation && !validation.isValid;
	const hasWarnings = validation && validation.warnings.length > 0;
	// const isValid = validation && validation.isValid && !hasWarnings;

	return (
		<div className="space-y-2">
			{/* Statistics Row */}
			<div className="flex gap-2 text-xs flex-wrap">
				<div className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
					<span className="text-gray-500">Lines:</span>
					<span className="ml-1 font-semibold text-gray-900">
						{statistics.lines}
					</span>
				</div>
				<div
					className={`px-2 py-1 rounded border ${getComplexityColor(
						statistics.complexity
					)}`}
				>
					<span className="opacity-75">Complexity:</span>
					<span className="ml-1 font-semibold">{statistics.complexity}</span>
				</div>
				<div className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
					<span className="text-blue-600">Loops:</span>
					<span className="ml-1 font-semibold text-blue-900">
						{statistics.loops}
					</span>
				</div>
				<div className="px-2 py-1 bg-purple-50 rounded border border-purple-200">
					<span className="text-purple-600">Conditionals:</span>
					<span className="ml-1 font-semibold text-purple-900">
						{statistics.conditionals}
					</span>
				</div>

				{/* Validation Status Badge */}
				{validation && (
					<div
						className={`px-2 py-1 rounded border flex items-center gap-1 ${
							hasErrors
								? "bg-red-50 border-red-200 text-red-700"
								: hasWarnings
									? "bg-yellow-50 border-yellow-200 text-yellow-700"
									: "bg-green-50 border-green-200 text-green-700"
						}`}
					>
						{hasErrors ? (
							<FiAlertCircle size={14} />
						) : hasWarnings ? (
							<FiAlertTriangle size={14} />
						) : (
							<FiCheckCircle size={14} />
						)}
						<span className="font-semibold">
							{hasErrors ? "Errors" : hasWarnings ? "Warnings" : "Valid"}
						</span>
					</div>
				)}
			</div>

			{/* Validation Errors */}
			{hasErrors && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-2">
					<div className="flex items-start gap-2">
						<FiAlertCircle
							size={16}
							className="text-red-600 mt-0.5 flex-shrink-0"
						/>
						<div className="flex-1 min-w-0">
							<h4 className="text-xs font-semibold text-red-900 mb-1">
								Validation Errors
							</h4>
							<ul className="text-xs text-red-800 space-y-0.5">
								{validation.errors.map((error, i) => (
									<li key={i} className="truncate" title={error}>
										• {error}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			)}

			{/* Validation Warnings */}
			{hasWarnings && !hasErrors && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
					<div className="flex items-start gap-2">
						<FiAlertTriangle
							size={16}
							className="text-yellow-600 mt-0.5 flex-shrink-0"
						/>
						<div className="flex-1 min-w-0">
							<h4 className="text-xs font-semibold text-yellow-900 mb-1">
								Warnings
							</h4>
							<ul className="text-xs text-yellow-800 space-y-0.5">
								{validation.warnings.map((warning, i) => (
									<li key={i} className="truncate" title={warning}>
										• {warning}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
