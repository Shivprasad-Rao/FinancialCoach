import { Router, Response } from 'express';
import db from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { detectSubscriptions } from '../services/subscriptionDetector';

const router = Router();

// GET /api/dashboard
// Aggregates Summary, Trends, Goals, and Subscriptions
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { year, month } = req.query;

        // 1. Goals (Global)
        const goalsStmt = db.prepare('SELECT * FROM goals WHERE user_id = ?');
        const goals = goalsStmt.all(userId);

        // 2. Subscriptions (Global / Recent)
        const subscriptions = detectSubscriptions(userId);

        // 3. Category Summary (Pie Chart) - Filters apply
        let summaryQuery = `
            SELECT category, SUM(amount) as total, COUNT(*) as count 
            FROM transactions 
            WHERE user_id = ? AND amount < 0
        `;
        const summaryParams: any[] = [userId];

        if (year) {
            summaryQuery += " AND strftime('%Y', date) = ?";
            summaryParams.push(year);
        }
        if (month) {
            summaryQuery += " AND strftime('%m', date) = ?";
            summaryParams.push(month);
        }
        summaryQuery += ' GROUP BY category';
        const summary = db.prepare(summaryQuery).all(...summaryParams);

        // 4. Monthly Trends (Bar Chart) - Year Filter applies
        let trendsQuery = `
            SELECT strftime('%Y-%m', date) as month, SUM(ABS(amount)) as total
            FROM transactions
            WHERE user_id = ? AND amount < 0
        `;
        const trendsParams: any[] = [userId];
        if (year) {
            trendsQuery += " AND strftime('%Y', date) = ?";
            trendsParams.push(year);
        }
        trendsQuery += ' GROUP BY month ORDER BY month ASC';

        const monthlyData = db.prepare(trendsQuery).all(...trendsParams) as { month: string; total: number }[];

        // Fill missing months if year selected
        let trends = monthlyData;
        if (year) {
            trends = [];
            for (let i = 1; i <= 12; i++) {
                const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
                const found = monthlyData.find(d => d.month === monthStr);
                trends.push(found || { month: monthStr, total: 0 });
            }
        }

        res.json({
            goals,
            subscriptions,
            summary: { breakdown: summary },
            trends
        });

    } catch (error) {
        console.error('Dashboard aggregation error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;
