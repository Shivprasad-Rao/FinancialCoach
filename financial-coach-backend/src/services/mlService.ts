import db from '../database/db';
import { Transaction } from '../types';

interface MLInsights {
    prediction: {
        nextMonthAmount: number;
        trend: 'up' | 'down' | 'stable';
        confidence: number;
    };
    anomalies: {
        category: string;
        amount: number;
        zScore: number;
        average: number;
    }[];
    budget: {
        needs: number;
        wants: number;
        savings: number;
        recommendation: string;
    };
}

export function getMLInsights(userId: number, year: string, month: string): MLInsights {
    const anchorDate = `${year}-${month}-01`;

    // 1. Prediction (Linear Regression on last 6 months)
    const prediction = predictNextMonth(userId, year, month);

    // 2. Anomaly Detection (Z-Score on categories)
    const anomalies = detectAnomalies(userId, year, month);

    // 3. Smart Budget (50/30/20 Rule Analysis)
    const budget = analyzeBudget(userId, year, month);

    return { prediction, anomalies, budget };
}

function predictNextMonth(userId: number, year: string, month: string) {
    // Get last 6 months of total expenses
    const stmt = db.prepare(`
        SELECT strftime('%Y-%m', date) as m, SUM(ABS(amount)) as total
        FROM transactions
        WHERE amount < 0 AND user_id = ? AND date < date(?, 'start of month')
        GROUP BY m
        ORDER BY m DESC
        LIMIT 6
    `);

    // SQLite date modifier usage: construct a proper date string for the modifier
    const targetDate = `${year}-${month}-01`;
    const rows = stmt.all(userId, targetDate) as { m: string, total: number }[];

    if (rows.length < 3) {
        return { nextMonthAmount: 0, trend: 'stable' as const, confidence: 0 };
    }

    // Linear Regression (X = index 0..N, Y = total)
    // Reverse rows to be chronological (oldest to newest)
    const data = rows.reverse().map((r, i) => ({ x: i, y: r.total }));

    const n = data.length;
    const sumX = data.reduce((acc, p) => acc + p.x, 0);
    const sumY = data.reduce((acc, p) => acc + p.y, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = data.reduce((acc, p) => acc + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next month (which is index n)
    const nextMonthPrediction = slope * n + intercept;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (slope > 50) trend = 'up';
    if (slope < -50) trend = 'down';

    // Calculate R-squared (Confidence)
    const meanY = sumY / n;
    const ssTot = data.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0);
    const ssRes = data.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const rSquared = 1 - (ssRes / (ssTot || 1)); // Avoid division by zero

    return {
        nextMonthAmount: Math.max(0, nextMonthPrediction),
        trend,
        confidence: Math.max(0, Math.min(1, rSquared))
    };
}

function detectAnomalies(userId: number, year: string, month: string) {
    const targetDate = `${year}-${month}-01`;

    // Simpler approach: Get all monthly totals for last 6 months per category, then compute in JS
    const historyStmt = db.prepare(`
        SELECT category, SUM(ABS(amount)) as total
        FROM transactions
        WHERE amount < 0 AND user_id = ? AND date < date(?, 'start of month') AND date >= date(?, '-6 months')
        GROUP BY category, strftime('%Y-%m', date)
    `);

    interface HistoryRow { category: string; total: number; }
    const history = historyStmt.all(userId, targetDate, targetDate) as HistoryRow[];

    // Group by category
    const catHistory: Record<string, number[]> = {};
    history.forEach(r => {
        if (!catHistory[r.category]) catHistory[r.category] = [];
        catHistory[r.category].push(r.total);
    });

    // Get current month totals
    const currentStmt = db.prepare(`
        SELECT category, SUM(ABS(amount)) as total
        FROM transactions
        WHERE amount < 0 AND user_id = ? AND strftime('%Y-%m', date) = ?
        GROUP BY category
    `);
    const currentData = currentStmt.all(userId, `${year}-${month}`) as HistoryRow[];

    const anomalies: any[] = [];

    currentData.forEach(curr => {
        const past = catHistory[curr.category] || [];
        if (past.length < 3) return; // Not enough history

        // Calculate Mean and StdDev
        const mean = past.reduce((a, b) => a + b, 0) / past.length;
        const variance = past.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (past.length - 1 || 1);
        const stdDev = Math.sqrt(variance);

        // Z-Score
        const zScore = (curr.total - mean) / (stdDev || 1);

        if (zScore > 2.0 && curr.total > 100) { // Threshold: >2 sigmas and meaningful amount
            anomalies.push({
                category: curr.category,
                amount: curr.total,
                zScore: parseFloat(zScore.toFixed(2)),
                average: parseFloat(mean.toFixed(2))
            });
        }
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore);
}

function analyzeBudget(userId: number, year: string, month: string) {
    const targetMonth = `${year}-${month}`;

    // Get Income and Expenses
    const stmt = db.prepare(`
        SELECT 
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expense,
            category
        FROM transactions
        WHERE user_id = ? AND strftime('%Y-%m', date) = ?
        GROUP BY category
    `);

    interface Row { income: number; expense: number; category: string }
    const rows = stmt.all(userId, targetMonth) as Row[];

    const totalIncome = rows.reduce((acc, r) => acc + r.income, 0);

    // Heuristic categorization
    let needs = 0;
    let wants = 0;
    let savings = 0; // Usually transfers to savings accounts

    const needsCategories = ['Rent', 'Utilities', 'Groceries', 'Health', 'Transport', 'Insurance'];

    rows.forEach(r => {
        // Only count expenses
        if (r.expense > 0) {
            if (needsCategories.some(n => r.category.includes(n))) {
                needs += r.expense;
            } else if (r.category.toLowerCase().includes('saving') || r.category.toLowerCase().includes('invest')) {
                savings += r.expense;
            } else {
                wants += r.expense;
            }
        }
    });

    // If savings usually come from positive transfers out? Or just unspent income?
    // 50/30/20 Rule: 50% Needs, 30% Wants, 20% Savings.
    // Real Savings = Income - Expenses (if positive).
    const realSavings = Math.max(0, totalIncome - (needs + wants));

    let recommendation = "Your budget looks balanced.";
    if (totalIncome > 0) {
        const needsPct = (needs / totalIncome) * 100;
        const wantsPct = (wants / totalIncome) * 100;

        if (needsPct > 60) recommendation = "Needs are high (>60%). Look for cheaper utilities or rent.";
        else if (wantsPct > 40) recommendation = "Wants are high (>40%). Cut back on Shopping/Dining.";
        else if (realSavings < (totalIncome * 0.1)) recommendation = "Savings are low (<10%). Try to save at least 20%.";
        else recommendation = "Great job! You are following the 50/30/20 rule closely.";
    }

    return {
        needs,
        wants,
        savings: realSavings,
        recommendation
    };
}
