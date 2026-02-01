import { Router, Response } from 'express';
import { generateInsights } from '../services/insightsEngine';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/advisor/analyze
router.post('/analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        // reuse the core engine which generates both insights and advice
        const result = await generateInsights(userId);

        res.json({ advice: result.advice });
    } catch (error) {
        console.error('Advisor error:', error);
        res.status(500).json({ error: 'Failed to generate advice' });
    }
});

// POST /api/advisor/flag
router.post('/flag', authenticateToken, (req: AuthRequest, res: Response) => {
    const { id, reason } = req.body;
    console.log(`[User Feedback] User ${req.user!.username} flagged insight/sub ${id} as error: ${reason}`);
    // Ideally store this in DB to improve future ML
    res.json({ success: true, message: "Feedback received" });
});

export default router;
