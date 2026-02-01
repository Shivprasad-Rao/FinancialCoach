import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './database/db';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Rate limiting: 300 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per `windowMs`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

import transactionsRouter from './routes/transactions';
import insightsRouter from './routes/insights';
import subscriptionsRouter from './routes/subscriptions';
import goalsRouter from './routes/goals';
import advisorRouter from './routes/advisor';
import debugRouter from './routes/debug';
import authRouter from './routes/auth';

app.use(cors({
    origin: process.env.FRONTEND_URL, // Allow Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/debug', debugRouter);

// Initialize Database
try {
    initDb();
} catch (error) {
    console.error('Failed to initialize database:', error);
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
