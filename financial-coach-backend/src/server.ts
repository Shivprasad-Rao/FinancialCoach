import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './database/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

import transactionsRouter from './routes/transactions';
import insightsRouter from './routes/insights';
import subscriptionsRouter from './routes/subscriptions';
import goalsRouter from './routes/goals';
import advisorRouter from './routes/advisor';
import debugRouter from './routes/debug';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
