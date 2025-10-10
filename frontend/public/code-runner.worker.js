// public/code-runner.worker.js

const executionContext = {
	console: {
		logs: [],
		log: (...args) => {
			executionContext.console.logs.push({
				type: "log",
				message: args
					.map((arg) => {
						try {
							return typeof arg === "object"
								? JSON.stringify(arg)
								: String(arg);
						} catch {
							return String(arg);
						}
					})
					.join(" "),
				timestamp: Date.now(),
			});
		},
		error: (...args) => {
			executionContext.console.logs.push({
				type: "error",
				message: args
					.map((arg) => {
						try {
							return typeof arg === "object"
								? JSON.stringify(arg)
								: String(arg);
						} catch {
							return String(arg);
						}
					})
					.join(" "),
				timestamp: Date.now(),
			});
		},
		warn: (...args) => {
			executionContext.console.logs.push({
				type: "warn",
				message: args
					.map((arg) => {
						try {
							return typeof arg === "object"
								? JSON.stringify(arg)
								: String(arg);
						} catch {
							return String(arg);
						}
					})
					.join(" "),
				timestamp: Date.now(),
			});
		},
	},
};

self.addEventListener("message", async (event) => {
	const { id, code, functionName, args } = event.data;

	// Reset console logs
	executionContext.console.logs = [];

	try {
		// Create the function in isolated scope
		const userFunction = new Function(
			"console",
			`
			"use strict";
			${code}
			return ${functionName};
		`
		)(executionContext.console);

		// Execute with timing
		const startTime = Date.now();
		const result = await userFunction(...args);
		const executionTime = Date.now() - startTime;

		// Send success response
		self.postMessage({
			id,
			success: true,
			result: JSON.parse(JSON.stringify(result)), // Deep clone
			logs: executionContext.console.logs,
			executionTime,
		});
	} catch (error) {
		// Send error response
		self.postMessage({
			id,
			success: false,
			error: {
				message: error.message,
				stack: error.stack,
				name: error.name,
			},
			logs: executionContext.console.logs,
		});
	}
});
