// hooks/useCodeRunner.ts

import { useState, useEffect, useRef, useCallback } from "react";

import {
	FunctionSchema,
	getFunctionSchema,
} from "../mock-engine/code-runners/function-registry";
import {
	CodeRunner,
	ExecutionResult,
} from "../mock-engine/code-runners/runner";

export const useCodeRunner = (functionName: string) => {
	const [isExecuting, setIsExecuting] = useState(false);
	const [result, setResult] = useState<ExecutionResult | null>(null);
	const [schema, setSchema] = useState<FunctionSchema | null>(null);
	const runnerRef = useRef<CodeRunner | null>(null);

	useEffect(() => {
		// Initialize schema
		const functionSchema = getFunctionSchema(functionName);
		if (functionSchema) {
			setSchema(functionSchema);
		}

		// Initialize code runner
		runnerRef.current = new CodeRunner();

		return () => {
			// Cleanup
			runnerRef.current?.terminate();
		};
	}, [functionName]);

	const executeCode = useCallback(
		async (functionBody: string, args: any[]) => {
			if (!schema || !runnerRef.current) {
				console.error("Schema or runner not initialized");
				return;
			}

			setIsExecuting(true);
			setResult(null);

			try {
				const executionResult = await runnerRef.current.execute(
					functionBody,
					schema,
					args
				);
				setResult(executionResult);
				return executionResult;
			} catch (error: any) {
				const errorResult: ExecutionResult = {
					timestamp: new Date().toISOString(),
					success: false,
					error: {
						message: error.message,
						name: error.name,
					},
					logs: [],
					validation: { isValid: false, errors: [error.message], warnings: [] },
				};
				setResult(errorResult);
				return errorResult;
			} finally {
				setIsExecuting(false);
			}
		},
		[schema]
	);

	const clearResult = useCallback(() => {
		setResult(null);
	}, []);

	return {
		executeCode,
		isExecuting,
		result,
		schema,
		clearResult,
	};
};
