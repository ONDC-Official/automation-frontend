// redisClient.ts
import Redis from 'ioredis';

// Create a single Redis client instance
const redisClient = new Redis({
    host: '127.0.0.1', // Replace with your Redis host
    port: 6379,        // Replace with your Redis port
    // password: 'ondc1234', // Uncomment if using authentication
});

// Export the single instance
export default redisClient;
