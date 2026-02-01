import { Router } from 'express';
import db from '../database/db';

const router = Router();

// GET /api/goals
router.get('/', (req, res) => {
    const stmt = db.prepare('SELECT * FROM goals');
    const goals = stmt.all();
    res.json(goals);
});

// POST /api/goals
router.post('/', (req, res) => {
    const { name, target_amount, deadline } = req.body;
    if (!name || !target_amount || !deadline) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
    INSERT INTO goals (name, target_amount, current_amount, deadline)
    VALUES (?, ?, 0, ?)
  `);

    const info = stmt.run(name, target_amount, deadline);
    res.json({ id: info.lastInsertRowid, success: true });
});

// PUT /api/goals/:id (Update amount)
router.put('/:id', (req, res) => {
    const { current_amount } = req.body;
    const stmt = db.prepare('UPDATE goals SET current_amount = ? WHERE id = ?');
    stmt.run(current_amount, req.params.id);
    res.json({ success: true });
});

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
});

export default router;
