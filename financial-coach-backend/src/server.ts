import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './database/db';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Security Middleware
app.use(helmet());

// Rate limiting: 300 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

import transactionsRouter from './routes/transactions';
import insightsRouter from './routes/insights';
import subscriptionsRouter from './routes/subscriptions';
import goalsRouter from './routes/goals';
import advisorRouter from './routes/advisor';
import debugRouter from './routes/debug';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers', 'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Access-Control-Request-Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/debug', debugRouter);
app.use('/api/dashboard', dashboardRouter);

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
