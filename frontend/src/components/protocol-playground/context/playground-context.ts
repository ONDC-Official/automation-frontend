import { MockPlaygroundConfigType } from "../mock-engine/types";
import { Context, createContext } from "react";
interface PlaygroundContextProps {
	config: MockPlaygroundConfigType | undefined;
	setCurrentConfig: (config: MockPlaygroundConfigType | undefined) => void;
	currentState: "editing" | "running";
	setCurrentState: React.Dispatch<React.SetStateAction<"editing" | "running">>;
	updateStepMock: (stepId: string, property: string, value: string) => void;
}
export const PlaygroundContext: Context<PlaygroundContextProps> =
	createContext<PlaygroundContextProps>({} as PlaygroundContextProps);
