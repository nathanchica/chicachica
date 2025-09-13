import { Router, Request, Response } from 'express';

import { sql } from '../db/client.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
    try {
        const response = await sql`SELECT version()`;
        const { version } = response[0];
        res.json({ status: 'Server is running', databaseVersion: version });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ status: 'Server is running', databaseStatus: 'Error' });
    }
});

export default router;
