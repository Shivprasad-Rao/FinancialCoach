import { Router } from 'express';
import db from '../database/db';

const router = Router();

// POST /api/debug/reset
// Clears all data from the database
router.post('/reset', (req, res) => {
    try {
        console.log("Resetting database...");

        // Use a transaction for atomicity
        const clear = db.transaction(() => {
            db.prepare('DELETE FROM transactions').run();
            // Also need to reset subscriptions if we persist them in future (currently calculated on fly)
            // db.prepare('DELETE FROM subscriptions').run(); 
            db.prepare('DELETE FROM goals').run();
            // Don't delete categories as they are useful metadata, unless requested.
            // Let's keep categories.
        });

        clear();

        console.log("Database reset complete.");
        res.json({ success: true, message: 'Database cleared successfully.' });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

export default router;
