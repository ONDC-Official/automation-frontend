import { useContext } from "react";
import { PlaygroundContext } from "../context/playground-context";

export default function SessionDataTab() {
	const playgroundContext = useContext(PlaygroundContext);
	const { config, activeApi } = playgroundContext;

	return (
		<div className="overflow-auto h-full">
			<pre className="text-xs">
				{JSON.stringify(config?.transaction_history, null, 2)}
			</pre>
		</div>
	);
}
