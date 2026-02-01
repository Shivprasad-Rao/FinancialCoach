import { Router } from 'express';
import { detectSubscriptions } from '../services/subscriptionDetector';
import db from '../database/db';

const router = Router();

// GET /api/subscriptions
router.get('/', (req, res) => {
    try {
        // Return detected subscriptions
        // In future, we could store them in 'subscriptions' table and sync.
        // For MVP, just calculate on fly or return from table if we saved them.
        const subs = detectSubscriptions();
        res.json(subs);
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

export default router;
