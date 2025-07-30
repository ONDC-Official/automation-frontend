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

app.use(logger.getCorrelationIdMiddleware());

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://saarthi.ondc.org.in",
			"https://preview--ondc-developer-portal.lovable.app",
		],
		credentials: true,
	})
);

app.use(express.json());
// Middleware to parse cookies
app.use(cookieParser());

app.use(routes);

export default app;
