import db from '../database/db';
import { Transaction, Subscription } from '../types';

export function detectSubscriptions(): (Subscription & { is_gray_charge?: boolean })[] {
  // 1. Fetch all transactions for merchants with > 1 occurrence
  const stmt = db.prepare(`
    SELECT merchant, amount, date
    FROM transactions
    WHERE amount < 0
    ORDER BY merchant, date ASC
  `);

  const rows = stmt.all() as { merchant: string, amount: number, date: string }[];

  // Group by merchant
  const groups: Record<string, { dates: number[], amounts: number[] }> = {};
  rows.forEach(r => {
    if (!groups[r.merchant]) groups[r.merchant] = { dates: [], amounts: [] };
    groups[r.merchant].dates.push(new Date(r.date).getTime());
    groups[r.merchant].amounts.push(Math.abs(r.amount));
  });

  // Determine the "Current" date reference from the data itself (to support historical uploads)
  const allDates = rows.map(r => new Date(r.date).getTime());
  const MAX_DATE = allDates.length > 0 ? Math.max(...allDates) : new Date().getTime();

  const detected: (Subscription & { is_gray_charge?: boolean })[] = [];

  for (const [merchant, data] of Object.entries(groups)) {
    if (data.dates.length < 2) continue;

    // Calculate Intervals
    const intervals_days: number[] = [];
    for (let i = 1; i < data.dates.length; i++) {
      const diffMs = data.dates[i] - data.dates[i - 1];
      intervals_days.push(diffMs / (1000 * 60 * 60 * 24));
    }

    // Stats for Intervals
    const sumInterval = intervals_days.reduce((a, b) => a + b, 0);
    const avgInterval = sumInterval / intervals_days.length;

    const variance = intervals_days.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals_days.length;
    const stdDev = Math.sqrt(variance);
    // Coefficient of Variation (Regularity)
    const cv = stdDev / (avgInterval || 1);

    // Stats for Amounts (Subscriptions usually have identical amounts)
    const sumAmt = data.amounts.reduce((a, b) => a + b, 0);
    const avgAmt = sumAmt / data.amounts.length;
    const amtVariance = data.amounts.reduce((a, b) => a + Math.pow(b - avgAmt, 2), 0) / data.amounts.length;
    const amtStdDev = Math.sqrt(amtVariance);

    // HEURISTICS / "ML-Lite" Logic
    const isRegularTiming = cv < 0.25;
    const isRegularAmount = amtStdDev < 1.0;

    if (isRegularTiming && isRegularAmount) {
      // It's a subscription!
      const lastDate = data.dates[data.dates.length - 1];
      const daysSinceLast = (MAX_DATE - lastDate) / (1000 * 60 * 60 * 24);

      const firstDate = data.dates[0];
      const daysSinceStart = (MAX_DATE - firstDate) / (1000 * 60 * 60 * 24);
      const isNew = daysSinceStart < 60;
      const isSmall = avgAmt < 20;

      const isGray = isNew && isSmall;

      detected.push({
        merchant,
        amount: avgAmt,
        frequency: avgInterval > 350 ? 'yearly' : (avgInterval > 25 ? 'monthly' : 'weekly'),
        last_charge_date: new Date(lastDate).toISOString().split('T')[0],
        is_active: daysSinceLast < 45, // Consider active if charged recently relative to dataset
        is_gray_charge: isGray
      });
    }
  }

  return detected.sort((a, b) => b.amount - a.amount);
}
