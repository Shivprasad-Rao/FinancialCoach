import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database/db';
import { z } from 'zod';
import { validate } from '../middleware/validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';

// Schemas
const authSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6)
});

// POST /api/auth/register
router.post('/register', validate(authSchema), async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        const info = stmt.run(username, hashedPassword);

        res.json({ success: true, userId: info.lastInsertRowid });
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', validate(authSchema), async (req, res) => {
    try {
        const { username, password } = req.body;

        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username) as { id: number, username: string, password_hash: string } | undefined;

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username } });

    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
