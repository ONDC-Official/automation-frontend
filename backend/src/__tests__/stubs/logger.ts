/**
 * Stand-in for @ondc/automation-logger. The real module ships logs to Loki and
 * installs OTel correlation middleware, neither of which a unit test should
 * reach for.
 */
export default {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {},
	getCorrelationIdMiddleware:
		() => (_req: unknown, _res: unknown, next: () => void) =>
			next(),
};
