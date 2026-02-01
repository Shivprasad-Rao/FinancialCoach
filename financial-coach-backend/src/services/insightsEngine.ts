import db from '../database/db';
import { Transaction, Insight } from '../types';
import { generateCombinedAnalysis } from './geminiService';
import { detectSubscriptions } from './subscriptionDetector';

export async function generateInsights(): Promise<{ insights: Insight[], advice: string }> {
    // 0. Determine "Current" Date (Anchor to latest transaction)
    const maxDateStmt = db.prepare("SELECT MAX(date) as lastDate FROM transactions");
    const maxDateResult = maxDateStmt.get() as { lastDate: string } | undefined;
    const anchorDate = maxDateResult?.lastDate || new Date().toISOString().split('T')[0];

    // Data Point 1: Total Spend Last 30 Days
    const totalSpendStmt = db.prepare(`
        SELECT SUM(amount) as total 
        FROM transactions 
        WHERE amount < 0 
        AND date >= date(?, '-30 days')
        AND date <= ?
    `);
    const totalSpendRes = totalSpendStmt.get(anchorDate, anchorDate) as { total: number };
    const totalSpend30Days = Math.abs(totalSpendRes.total || 0);

    // Data Point 2: Top Spending Category
    const topCategoryStmt = db.prepare(`
        SELECT category, ABS(SUM(amount)) as total
        FROM transactions
        WHERE amount < 0
        AND date >= date(?, '-30 days')
        AND date <= ?
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
    `);
    const topCategory = topCategoryStmt.get(anchorDate, anchorDate) as { category: string, total: number } | undefined;

    // Data Point 3: Largest Single Purchase (Last 30 days)
    const largeTxStmt = db.prepare(`
        SELECT merchant, description, amount, date
        FROM transactions
        WHERE amount < 0
        AND date >= date(?, '-30 days')
        AND date <= ?
        ORDER BY amount ASC
        LIMIT 1
    `);
    const largestTx = largeTxStmt.get(anchorDate, anchorDate) as Transaction | undefined;

    // Data Point 4: Anomaly Detection (Statistical Z-Score simplified)
    // Find transactions > 2 * StdDev of average transaction
    const statsStmt = db.prepare(`
        SELECT AVG(amount) as avg_amt, CAST((SUM(amount*amount) - SUM(amount)*SUM(amount)/COUNT(*)) / (COUNT(*) - 1) AS REAL) as variance
        FROM transactions
        WHERE amount < 0
    `);
    const stats = statsStmt.get() as { avg_amt: number, variance: number }; // SQLite variance calculation is tricky, simplified assumption here

    // Simple heuristic for anomaly: > 3x average transaction size
    const avgTxSize = Math.abs(stats.avg_amt || 50);
    const anomalyThreshold = avgTxSize * 3;

    const anomalyStmt = db.prepare(`
        SELECT merchant, amount FROM transactions 
        WHERE amount < 0 AND ABS(amount) > ? AND date >= date(?, '-30 days')
        LIMIT 1
    `);
    const anomalyTx = anomalyStmt.get(anomalyThreshold, anchorDate) as Transaction | undefined;


    // Data Point 5: Active Subscriptions & Gray Charges
    const subs = detectSubscriptions();
    const subTotal = subs.reduce((acc, s) => acc + s.amount, 0);
    const grayCharges = subs.filter(s => s.is_gray_charge);

    // Data Point 6: Goals
    const goalsStmt = db.prepare('SELECT * FROM goals WHERE current_amount < target_amount');
    const activeGoals = goalsStmt.all() as any[];

    // Construct Context for AI
    const financialContext = {
        anchorDate,
        summary: {
            total_spend_last_30_days: totalSpend30Days.toFixed(2),
            top_category: topCategory ? `${topCategory.category} ($${topCategory.total.toFixed(2)})` : "N/A",
            largest_transaction: largestTx ? `${largestTx.merchant || largestTx.description} ($${Math.abs(largestTx.amount).toFixed(2)})` : "N/A",
            active_subscriptions_count: subs.length,
            subscriptions_total: subTotal.toFixed(2),
            gray_charges_detected: grayCharges.map(g => g.merchant),
            active_goals: activeGoals.map(g => `${g.name}: $${g.current_amount}/$${g.target_amount} (Due: ${g.deadline})`),
            potential_anomaly: anomalyTx ? `Unusual spent: $${Math.abs(anomalyTx.amount).toFixed(2)} at ${anomalyTx.merchant}` : "None"
        }
    };

    // Call Gemini AI
    console.log("Generating combined analysis context:", JSON.stringify(financialContext, null, 2));
    const analysis = await generateCombinedAnalysis(financialContext);

    // Inject detected anomaly as a structured insight if not already present
    if (anomalyTx && !analysis.insights.some(i => i.type === 'alert')) {
        analysis.insights.unshift({
            id: 'ml_anomaly',
            type: 'alert',
            title: 'Spending Anomaly Detected',
            message: `Unusual transaction of $${Math.abs(anomalyTx.amount).toFixed(2)} at ${anomalyTx.merchant}. Is this correct?`,
            impact_amount: Math.abs(anomalyTx.amount)
        });
    }

    // --- Predictive Burn Rate Analysis ---
    const burnRateStatus = calculateBurnRate(anchorDate);
    if (burnRateStatus) {
        analysis.insights.push(burnRateStatus);
    }
    // -------------------------------------

    // Fallback static insights if AI returns nothing but keeps advice, or just error handling?
    // generateCombinedAnalysis handles structure, so we assume it's good.
    // If empty insights, we inject static ones?
    if (analysis.insights.length === 0) {
        analysis.insights = generateStaticInsights(anchorDate);
    }

    return analysis;
}

function calculateBurnRate(anchorDate: string): Insight | null {
    // 1. Get daily cumulative spend for current month
    const startOfMonth = anchorDate.substring(0, 7) + '-01';
    const stmt = db.prepare(`
        SELECT date, SUM(ABS(amount)) as daily_total
        FROM transactions
        WHERE amount < 0 AND date >= ? AND date <= ?
        GROUP BY date
        ORDER BY date ASC
    `);

    const dailyData = stmt.all(startOfMonth, anchorDate) as { date: string, daily_total: number }[];
    if (dailyData.length < 5) return null; // Need sufficient data points

    // 2. Prepare X (Day of Month) and Y (Cumulative Spend)
    let cumulative = 0;
    const points = dailyData.map(d => {
        cumulative += d.daily_total;
        const day = parseInt(d.date.split('-')[2]);
        return { x: day, y: cumulative };
    });

    // 3. Simple Linear Regression (y = mx + b)
    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 4. Predict End of Month
    // Assumes 30 days for simplicity, or could calculate actual days in month
    const daysInMonth = new Date(new Date(anchorDate).getFullYear(), new Date(anchorDate).getMonth() + 1, 0).getDate();
    const projectedTotal = slope * daysInMonth + intercept;

    // 5. Compare against "Average" monthly spend (last 3 months)
    const avgStmt = db.prepare(`
        SELECT AVG(monthly_total) as avg_spend FROM (
            SELECT strftime('%Y-%m', date) as m, SUM(ABS(amount)) as monthly_total
            FROM transactions
            WHERE amount < 0 AND date < ? 
            GROUP BY m
            ORDER BY m DESC
            LIMIT 3
        )
    `);
    const avgRes = avgStmt.get(startOfMonth) as { avg_spend: number };
    const avgSpend = avgRes.avg_spend || projectedTotal; // Fallback if no history

    // 6. Generate Insight
    if (projectedTotal > avgSpend * 1.15) {
        return {
            id: 'burn_rate_warning',
            type: 'alert',
            title: 'High Burn Rate Projected',
            message: `At your current pace ($${slope.toFixed(0)}/day), you're projected to spend $${projectedTotal.toFixed(0)} this month, which is higher than your average of $${avgSpend.toFixed(0)}.`,
            impact_amount: projectedTotal - avgSpend
        };
    } else if (projectedTotal < avgSpend * 0.85) {
        return {
            id: 'burn_rate_good',
            type: 'achievement',
            title: 'On Track to Save',
            message: `Great job! You're projected to spend only $${projectedTotal.toFixed(0)} this month, saving ~$${(avgSpend - projectedTotal).toFixed(0)} vs your average.`,
            impact_amount: avgSpend - projectedTotal
        };
    }

    return null;
}

function generateStaticInsights(anchorDate: string): Insight[] {
    const insights: Insight[] = [];

    // 1. Large Purchase
    const largeTxStmt = db.prepare(`SELECT * FROM transactions WHERE amount < -200 AND strftime('%Y-%m', date) = strftime('%Y-%m', ?) ORDER BY amount ASC LIMIT 1`);
    const largeTx = largeTxStmt.get(anchorDate) as Transaction | undefined;

    if (largeTx) {
        insights.push({
            id: 'large_purchase',
            type: 'alert',
            title: 'Large Purchase Detected',
            message: `You spent $${Math.abs(largeTx.amount).toFixed(2)} at ${largeTx.merchant || largeTx.description}.`,
            impact_amount: Math.abs(largeTx.amount)
        });
    }

    // 2. Goal Insight
    const goals = db.prepare('SELECT * FROM goals').all() as any[];
    if (goals.length > 0) {
        const goal = goals[0];
        const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
        insights.push({
            id: 'goal_insight',
            type: 'opportunity',
            title: 'Goal Progress',
            message: `You are ${progress.toFixed(0)}% of the way to your "${goal.name}" goal! Keep going!`,
            impact_amount: 0
        });
    }

    // 3. Predictive Burn Rate (Static)
    // We can reuse the function here for static generation too!
    const burnRate = calculateBurnRate(anchorDate);
    if (burnRate) {
        insights.push(burnRate);
    }

    return insights;
}
