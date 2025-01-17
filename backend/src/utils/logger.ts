import winston from "winston";
import chalk from "chalk";

const { combine, timestamp, printf, errors } = winston.format;

// Define colors for log levels and messages
const levelColors: Record<string, chalk.Chalk> = {
	error: chalk.bold.red, // Bright red for errors
	warn: chalk.hex("#FFA500"), // Orange for warnings
	info: chalk.blue, // Blue for information
	debug: chalk.green, // Green for debugging
	default: chalk.white, // Default color for others
};

const messageColors: Record<string, chalk.Chalk> = {
	error: chalk.redBright, // Highlight error messages
	warn: chalk.yellowBright, // Bright yellow for warnings
	info: chalk.cyan, // Cyan for information messages
	debug: chalk.magentaBright, // Bright magenta for debugging
	default: chalk.gray, // Default gray for fallback
};

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }: any) => {
	const levelColor = levelColors[level] || levelColors.default; // Colorize level
	const messageColor = messageColors[level] || messageColors.default; // Colorize message

	const coloredLevel = levelColor(`[${level.toUpperCase()}]`); // Apply color to log level
	const coloredTimestamp = chalk.dim(timestamp); // Dim timestamp
	const coloredMessage = messageColor(message); // Apply message-specific color
	const coloredStack = stack ? chalk.dim(stack) : ""; // Dim stack trace if present

	return `${coloredTimestamp} ${coloredLevel}: ${coloredMessage} ${coloredStack}`;
});

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

// Configure Winston logger
const logger = winston.createLogger({
	level: logLevel,
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		errors({ stack: true }), // Include stack trace in error messages
		logFormat
	),
	transports: [
		// Console transport with colorized output
		new winston.transports.Console(),
	],
});

export default logger;
