import { Router } from 'express';
import { generateInsights } from '../services/insightsEngine';

const router = Router();

// POST /api/advisor/analyze
router.post('/analyze', async (req, res) => {
    try {
        // reuse the core engine which generates both insights and advice
        const result = await generateInsights();

        res.json({ advice: result.advice });
    } catch (error) {
        console.error('Advisor error:', error);
        res.status(500).json({ error: 'Failed to generate advice' });
    }
});

// POST /api/advisor/flag
router.post('/flag', (req, res) => {
    const { id, reason } = req.body;
    console.log(`[User Feedback] User flagged insight/sub ${id} as error: ${reason}`);
    // Ideally store this in DB to improve future ML
    res.json({ success: true, message: "Feedback received" });
});

export default router;
