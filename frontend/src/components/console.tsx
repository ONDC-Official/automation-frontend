import { useState } from "react";
import { ILogs } from "../interface/index";
import { getLogs } from "../utils/request-utils";
import { FaTerminal } from "react-icons/fa6";
import { GoDash } from "react-icons/go";
import CircularProgress from "./ui/circular-cooldown";

interface IProps {
	logs: ILogs[];
	setLogs: React.Dispatch<React.SetStateAction<ILogs[]>>;
	sessionId: string | null;
}

const Console = ({ logs, setLogs, sessionId }: IProps) => {
	async function getLogsData() {
		{
			if (!sessionId) return;
			const logs = await getLogs(sessionId);
			setLogs(logs);
		}
	}

	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="fixed bottom-4 right-4 z-50 bg-white p-2 shadow-md rounded-sm">
			{isOpen ? (
				<div className="w-[350px]">
					<div className="items-center flex justify-end p-1">
						<CircularProgress
							sqSize={24}
							strokeWidth={3}
							duration={3}
							onComplete={getLogsData}
							loop={true}
						/>
						<div
							onClick={() => setIsOpen(false)}
							className="flex items-center justify-center p-2 ml-2 rounded-md shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
        text-gray-600 bg-gray-100 hover:bg-gray-200 focus:ring-gray-400"
						>
							<GoDash />
						</div>
					</div>

					<div className="bg-black rounded-sm p-2 flex flex-col gap-2 h-[300px] overflow-scroll">
						{logs.length === 0 && (
							<p className="text-white">{`No logs yet.`}</p>
						)}
						{logs.map((log) => (
							<div>
								<p className="text-white">{`> ${log.message}`}</p>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="p-2" onClick={() => setIsOpen(true)}>
					<FaTerminal />
				</div>
			)}
		</div>
	);
};

export default Console;
