import { Router, Response } from 'express';
import { detectSubscriptions } from '../services/subscriptionDetector';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import db from '../database/db';

const router = Router();

// GET /api/subscriptions
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        // Detect and return subscriptions for this user
        const subs = detectSubscriptions(userId);
        res.json(subs);
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

// POST /api/subscriptions/flag
router.post('/flag', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { merchant, is_false_positive } = req.body;

        if (!merchant) return res.status(400).json({ error: 'Merchant is required' });

        const stmt = db.prepare('INSERT INTO subscription_feedback (user_id, merchant, is_false_positive) VALUES (?, ?, ?)');
        stmt.run(userId, merchant, is_false_positive ? 1 : 0);

        res.json({ success: true });
    } catch (error) {
        console.error('Flag error:', error);
        res.status(500).json({ error: 'Failed to flag subscription' });
    }
});

export default router;
