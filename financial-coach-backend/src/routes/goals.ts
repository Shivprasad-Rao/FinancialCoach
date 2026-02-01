import { Router, Response } from 'express';
import db from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validate, createGoalSchema, updateGoalSchema } from '../middleware/validation';

const router = Router();

// GET /api/goals
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const stmt = db.prepare('SELECT * FROM goals WHERE user_id = ?');
        const goals = stmt.all(req.user!.id);
        res.json(goals);
    } catch (error) {
        console.error('Fetch goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// POST /api/goals
router.post('/', authenticateToken, validate(createGoalSchema), (req: AuthRequest, res: Response) => {
    try {
        const { name, target_amount, deadline } = req.body;
        const userId = req.user!.id;

        const stmt = db.prepare(`
            INSERT INTO goals (user_id, name, target_amount, current_amount, deadline)
            VALUES (?, ?, ?, 0, ?)
        `);

        const info = stmt.run(userId, name, target_amount, deadline);
        res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// PUT /api/goals/:id (Update amount)
router.put('/:id', authenticateToken, validate(updateGoalSchema), (req: AuthRequest, res: Response) => {
    try {
        const { current_amount } = req.body;
        const userId = req.user!.id;

        // Ensure user owns the goal
        const stmt = db.prepare('UPDATE goals SET current_amount = ? WHERE id = ? AND user_id = ?');
        const result = stmt.run(current_amount, req.params.id, userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// DELETE /api/goals/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const stmt = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
        const result = stmt.run(req.params.id, userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

export default router;
