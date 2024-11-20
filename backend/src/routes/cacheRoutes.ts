import { Router, Request, Response } from 'express';
import { redisService } from "ondc-automation-cache-lib";

const router = Router();

// // Select and use database 0
// redisService.useDb(0);

// Route to set data in cache
router.post('/', async (req: Request, res: Response) => {
    const { key, value } = req.body;
    try {
        await redisService.setKey(key, value, 3600); // Cache data for 1 hour
        res.send({ message: 'Data cached successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error caching data', error });
    }
});

// // Route to get data from cache
router.get('/:key', async (req: Request, res: Response) => {
    const key = req.params.key;
    try {
        const value = await redisService.getKey(key);
        if (!value) {
            res.status(404).send({ message: 'Cache miss' });
        }
        res.send(value);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching from cache', error });
    }
});



// // Route to delete data from cache
// router.delete('/:key', async (req, res) => {
//     const key = req.params.key;
//     try {
//         await redisService.delete(key);
//         res.send({ message: 'Cache deleted' });
//     } catch (error) {
//         res.status(500).send({ message: 'Error deleting from cache', error });
//     }
// });

export default router;
