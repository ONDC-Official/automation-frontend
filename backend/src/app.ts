import express from 'express';
import routes from './routes/index';
import { RedisService } from "ondc-automation-cache-lib";
import cookieParser from 'cookie-parser';
// import redisClient from './config/redisConfig'; // Import the Redis client
import session from 'express-session';
import redisClient from './config/redisConfig';
import cors from "cors"
import { initializeLogSubscriber } from './services/logSubscriberService';
import logger from './utils/logger';
const RedisStore = require("connect-redis").default;

const app = express();

// Initialize Redis connections
const initializeRedis = async () => {
    try {
        // Initialize main DB connection (DB 0)
        RedisService.useDb(0);
        
        // Initialize log subscriber (DB 3)
        await initializeLogSubscriber();
        
        logger.info('Redis connections initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Redis connections:', error);
        process.exit(1);
    }
};

// Initialize Redis
initializeRedis();

// Log Redis connection status
// redisClient.on('connect', () => {
//     console.log('Redis client connected');
// });

// redisClient.on('error', (err) => {
//     console.error('Redis connection error:', err);
// });


let redisStore = new RedisStore({
    client: redisClient,
});

  app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'your-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // For production, set to true
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    }
  }));

app.use(cors())
app.use(express.json());
// Middleware to parse cookies
app.use(cookieParser());

app.use(routes);

export default app;
