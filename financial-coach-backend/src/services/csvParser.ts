import { parse } from 'csv-parse/sync';
import { Transaction } from '../types';
import { categorizeTransaction } from './categorizer';

export function parseTransactions(csvContent: string): Transaction[] {
    // Parse CSV with header detection
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true, // Handle Byte Order Mark
    });

    return records.map((record: any) => {
        // Helper to find value by flexible key match
        const getValue = (keys: string[]): string => {
            const recordKeys = Object.keys(record);
            for (const key of keys) {
                // Exact match
                if (record[key] !== undefined) return record[key];
                // Case-insensitive match
                const foundKey = recordKeys.find(k => k.toLowerCase().trim() === key.toLowerCase());
                if (foundKey && record[foundKey] !== undefined) return record[foundKey];
            }
            return '';
        };

        const rawAmountStr = getValue(['Amount', 'amount']);
        const rawAmount = parseFloat(rawAmountStr || '0');

        const type = getValue(['Transaction Type', 'transaction_type', 'type', 'Type']).toLowerCase().trim();

        // Sign logic: Debit = negative (expense), Credit = positive (income/payment)
        let finalAmount = Math.abs(rawAmount);
        // Sometimes banks use 'Debit' or 'DR' or 'D'
        if (type === 'debit' || type === 'dr' || type === 'withdrawal') {
            finalAmount = -finalAmount;
        }

        const description = getValue(['Description', 'description', 'Memo', 'memo']) || 'Unknown Transaction';
        const providedCategory = getValue(['Category', 'category']);
        const accountName = getValue(['Account Name', 'account_name', 'Account', 'account']);

        // Use provided category if available, otherwise auto-categorize
        const category = providedCategory && providedCategory.trim() !== ''
            ? providedCategory
            : categorizeTransaction(description);

        return {
            date: parseDate(getValue(['Date', 'date'])),
            description: description,
            amount: finalAmount,
            category: category,
            merchant: description,
            transactionType: type,
            accountName: accountName,
            is_recurring: false
        } as Transaction;
    });
}

function parseDate(rawDate: string): string {
    if (!rawDate) return new Date().toISOString().split('T')[0];

    // Handle MM/DD/YYYY
    if (rawDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const parts = rawDate.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }

    return rawDate;
}
