import { Router } from 'express';
import { parseTransactions } from '../services/csvParser';
import db from '../database/db';
import { Transaction } from '../types';
import { getMLInsights } from '../services/mlService';

const router = Router();

// POST /api/transactions/upload
// Receives JSON: { csvContent: string }
router.post('/upload', (req, res) => {
    try {
        const { csvContent } = req.body;
        if (!csvContent) {
            return res.status(400).json({ error: 'No CSV content provided' });
        }

        const transactions = parseTransactions(csvContent);

        // Check if we have transactions
        if (transactions.length === 0) {
            return res.status(400).json({ error: 'No transactions found in CSV' });
        }

        // Auto-create missing categories to prevent FK errors
        const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(c => c))];
        const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, keywords, icon) VALUES (?, '[]', 'circle')");

        db.transaction(() => {
            uniqueCategories.forEach(cat => insertCategory.run(cat));
        })();

        // Insert into DB
        const insert = db.prepare(`
      INSERT INTO transactions (date, description, amount, category, merchant, transaction_type, account_name, is_recurring)
      VALUES (@date, @description, @amount, @category, @merchant, @transactionType, @accountName, @is_recurring)
    `);

        const insertMany = db.transaction((txs: Transaction[]) => {
            for (const tx of txs) {
                insert.run({
                    date: tx.date,
                    description: tx.description,
                    amount: tx.amount,
                    category: tx.category,
                    merchant: tx.merchant || tx.description,
                    transactionType: tx.transactionType || null,
                    accountName: tx.accountName || null,
                    is_recurring: tx.is_recurring ? 1 : 0
                });
            }
        });

        insertMany(transactions);

        res.json({
            success: true,
            count: transactions.length,
            message: `Successfully imported ${transactions.length} transactions`
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process CSV' });
    }
});

// GET /api/transactions
// Optional query params: startDate, endDate, category
router.get('/', (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params: any[] = [];

        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY date DESC';

        const stmt = db.prepare(query);
        const transactions = stmt.all(...params);

        res.json(transactions);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/transactions/summary
// Basic aggregation for dashboard
// GET /api/transactions/summary
// Basic aggregation for dashboard
router.get('/summary', (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `
      SELECT category, SUM(amount) as total, COUNT(*) as count 
      FROM transactions 
      WHERE amount < 0
    `;
        const params: any[] = [];

        if (year) {
            query += " AND strftime('%Y', date) = ?";
            params.push(year);
        }

        if (month) {
            // month should be '01', '02', etc.
            query += " AND strftime('%m', date) = ?";
            params.push(month);
        }

        query += ' GROUP BY category';

        const categoriesStmt = db.prepare(query);
        const categoryBreakdown = categoriesStmt.all(...params);

        res.json({
            breakdown: categoryBreakdown
        });

    } catch (error) {
        console.error('Summary error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

// GET /api/transactions/monthly-summary
// For bar graph
router.get('/monthly-summary', (req, res) => {
    try {
        const { year } = req.query;
        let query = `
      SELECT strftime('%Y-%m', date) as month, SUM(ABS(amount)) as total
      FROM transactions
      WHERE amount < 0
    `;
        const params: any[] = [];

        if (year) {
            query += " AND strftime('%Y', date) = ?";
            params.push(year);
        }

        query += `
      GROUP BY month
      ORDER BY month ASC
    `;

        const stmt = db.prepare(query);
        const monthlyData = stmt.all(...params) as { month: string; total: number }[];

        // If a specific year is selected, fill in missing months with 0
        if (year) {
            const filledData = [];
            for (let i = 1; i <= 12; i++) {
                const monthStr = `${year}-${i.toString().padStart(2, '0')}`;
                const found = monthlyData.find(d => d.month === monthStr);
                filledData.push(found || { month: monthStr, total: 0 });
            }
            res.json(filledData);
        } else {
            res.json(monthlyData);
        }

    } catch (error) {
        console.error('Monthly summary error:', error);
        res.status(500).json({ error: 'Failed to get monthly summary' });
    }
});

// GET /api/transactions/analytics
// Aggregated Income vs Expense per month
router.get('/analytics', (req, res) => {
    try {
        const { year } = req.query;
        let query = `
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expense
            FROM transactions
            WHERE 1=1
        `;
        const params: any[] = [];

        if (year) {
            query += " AND strftime('%Y', date) = ?";
            params.push(year);
        }

        query += `
            GROUP BY month
            ORDER BY month ASC
        `;

        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as { month: string; income: number; expense: number }[];

        // Calculate balance and fill missing months if year selected
        const results = rows.map(r => ({
            month: r.month,
            income: r.income || 0,
            expense: r.expense || 0,
            balance: (r.income || 0) - (r.expense || 0)
        }));

        res.json(results);

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// GET /api/transactions/ml-insights
router.get('/ml-insights', (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month required' });
        }

        const insights = getMLInsights(year as string, month as string);
        res.json(insights);
    } catch (error) {
        console.error('ML Insights error:', error);
        res.status(500).json({ error: 'Failed to generate ML insights' });
    }
});

// GET /api/transactions/years
router.get('/years', (req, res) => {
    try {
        const stmt = db.prepare("SELECT DISTINCT strftime('%Y', date) as year FROM transactions WHERE date IS NOT NULL ORDER BY year DESC");
        const rows = stmt.all() as { year: string }[];
        res.json(rows.map(r => r.year));
    } catch (error) {
        console.error('Years fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch years' });
    }
});

// POST /api/transactions/manual
router.post('/manual', (req, res) => {
    try {
        const { date, description, amount, category, type } = req.body;

        if (!date || !amount || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const insert = db.prepare(`
            INSERT INTO transactions (date, description, amount, category, merchant, transaction_type, is_recurring)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        `);

        // If amount is positive but type is expense, make it negative.
        // Usually, inputs might be absolute values. Let's assume user input logic.
        // Ideally amount should be negative for expenses.
        let finalAmount = parseFloat(amount);
        if (type === 'expense' && finalAmount > 0) finalAmount = -finalAmount;
        if (type === 'income' && finalAmount < 0) finalAmount = Math.abs(finalAmount);

        const merchant = description; // Simple default

        const info = insert.run(date, description, finalAmount, category, merchant, type);
        res.json({ success: true, id: info.lastInsertRowid });

    } catch (error) {
        console.error("Manual add error:", error);
        res.status(500).json({ error: "Failed to add transaction" });
    }
});

// GET /api/transactions/categories
router.get('/categories', (req, res) => {
    try {
        // Get distinct categories from existing transactions
        const stmt = db.prepare("SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL ORDER BY category ASC");
        const rows = stmt.all() as { category: string }[];

        // Default categories if none exist
        const defaults = ['Food & Dining', 'Shopping', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Income', 'Transfer'];
        const existing = rows.map(r => r.category);
        const combined = Array.from(new Set([...defaults, ...existing])).sort();

        res.json(combined);
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

export default router;
