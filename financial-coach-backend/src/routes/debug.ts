import { Router, Response } from 'express';
import db from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/debug/reset
// Clears all data for the logged-in user only
router.post('/reset', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        console.log(`Resetting data for user ${userId}...`);

        // Use a transaction for atomicity
        const clear = db.transaction(() => {
            db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);
            // Also need to reset subscriptions if we persist them in future (currently calculated on fly)
            // db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);
        });

        clear();

        console.log(`Data reset complete for user ${userId}.`);
        res.json({ success: true, message: 'Your data has been cleared.' });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

export default router;
