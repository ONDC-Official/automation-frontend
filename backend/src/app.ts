import "./config/otelConfig";
import express from "express";
import routes from "./routes/index";
import { RedisService } from "@ondc/ondc-automation-cache-lib";
import cookieParser from "cookie-parser";
// import redisClient from './config/redisConfig'; // Import the Redis client
import session from "express-session";
import cors from "cors";
import { buildCorsOptions } from "./config/corsOptions";
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
    }),
);

app.use(cors(buildCorsOptions()));

// A Studio live session's graph document is well under 1 MB (the largest seen
// is ~140 KB): its route gets a 10 MB cap ahead of the global 75 MB one, which
// then finds the body already parsed.
app.use("/sessions/studio", express.json({ limit: "10mb" }));
app.use(express.json({ limit: "75mb" }));
app.use(express.urlencoded({ limit: "75mb", extended: true }));
// app.use(express.json());
// Middleware to parse cookies
app.use(cookieParser());
app.use(logger.getCorrelationIdMiddleware());
app.use(routes);

export default app;
