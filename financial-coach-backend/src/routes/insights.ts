import { Router } from 'express';
import { generateInsights } from '../services/insightsEngine';

const router = Router();

// GET /api/insights
router.get('/', async (req, res) => {
    try {
        const result = await generateInsights();
        // Return both insights and advice so frontend can display everything from one call
        res.json(result);
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

export default router;
