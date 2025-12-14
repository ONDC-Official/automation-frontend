import "./config/otelConfig";
import express from "express";
import routes from "./routes/index";
import { RedisService } from "ondc-automation-cache-lib";
import cookieParser from "cookie-parser";
// import redisClient from './config/redisConfig'; // Import the Redis client
import session from "express-session";
import cors from "cors";
const RedisStore = require("connect-redis").default;
import logger from "@ondc/automation-logger";
const app = express();

RedisService.useDb(0);

let redisStore = new RedisStore({
	client: RedisService,
});

app.use(
	session({
		store: redisStore,
		secret: process.env.SESSION_SECRET || "your-secret",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production", // For production, set to true
			maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
		},
	})
);

app.use(
	cors({
		origin: process.env.NODE_ENV === "development" 
			? true  // Allow all origins in development
			: [
				"http://localhost:5173",
				"http://localhost:4000",
				"https://saarthi.ondc.org.in",
				"https://preview--ondc-developer-portal.lovable.app",
				"https://workbench.ondc.tech"
			],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
	})
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(express.json());
// Middleware to parse cookies
app.use(cookieParser());
app.use(logger.getCorrelationIdMiddleware());
app.use(routes);

export default app;
