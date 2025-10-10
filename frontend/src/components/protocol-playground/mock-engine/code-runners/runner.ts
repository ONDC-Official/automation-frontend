// lib/code-runner/code-runner.ts

import { FunctionSchema } from "./function-registry";
import { CodeValidator, ValidationResult } from "./code-validator";

export interface ExecutionResult {
	timestamp: string;
	success: boolean;
	result?: any;
	error?: {
		message: string;
		stack?: string;
		name: string;
	};
	logs: Array<{
		type: "log" | "error" | "warn";
		message: string;
		timestamp: number;
	}>;
	executionTime?: number;
	validation: ValidationResult;
}

export class CodeRunner {
	private worker: Worker | null = null;
	private executionId = 0;
	private pendingExecutions = new Map<
		number,
		{
			resolve: (result: ExecutionResult) => void;
			timeout: number;
		}
	>();

	constructor() {
		this.initWorker();
	}

	private initWorker() {
		if (this.worker) {
			this.worker.terminate();
		}

		this.worker = new Worker("/code-runner.worker.js");

		this.worker.addEventListener("message", (event) => {
			const { id, success, result, error, logs, executionTime } = event.data;
			const pending = this.pendingExecutions.get(id);

			if (pending) {
				clearTimeout(pending.timeout);
				this.pendingExecutions.delete(id);

				pending.resolve({
					timestamp: new Date().toISOString(),
					success,
					result,
					error,
					logs,
					executionTime,
					validation: { isValid: true, errors: [], warnings: [] },
				});
			}
		});

		this.worker.addEventListener("error", (error) => {
			console.error("Worker error:", error);
			this.initWorker();
		});
	}

	async execute(
		functionBody: string,
		schema: FunctionSchema,
		args: any[]
	): Promise<ExecutionResult> {
		// Validate and wrap the function body
		const validation = CodeValidator.validate(functionBody, schema);
		console.log("Validation result:", validation);
		if (!validation.isValid || !validation.wrappedCode) {
			return {
				success: false,
				timestamp: new Date().toISOString(),
				error: {
					message: validation.errors.join("\n"),
					name: "ValidationError",
				},
				logs: [],
				validation,
			};
		}

		// Execute wrapped code in worker
		return new Promise((resolve) => {
			const id = ++this.executionId;
			const timeout = schema.timeout || 5000;

			const timeoutId = setTimeout(() => {
				this.pendingExecutions.delete(id);
				resolve({
					success: false,
					timestamp: new Date().toISOString(),
					error: {
						message: `Execution timeout after ${timeout}ms`,
						name: "TimeoutError",
					},
					logs: [],
					validation,
				});

				this.initWorker();
			}, timeout) as unknown as number; // Type assertion for compatibility

			this.pendingExecutions.set(id, {
				resolve: (result) => {
					resolve({ ...result, validation });
				},
				timeout: timeoutId,
			});

			console.log(args);

			this.worker?.postMessage({
				id,
				code: validation.wrappedCode,
				functionName: schema.name,
				args,
			});
		});
	}

	terminate() {
		this.worker?.terminate();
		this.worker = null;
	}
}
