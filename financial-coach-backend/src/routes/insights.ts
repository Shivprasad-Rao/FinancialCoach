import { Router, Response } from 'express';
import { generateInsights } from '../services/insightsEngine';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/insights
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const result = await generateInsights(userId);
        // Return both insights and advice so frontend can display everything from one call
        res.json(result);
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

export default router;
