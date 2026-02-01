import { useEffect, useState } from 'react';
import { endpoints } from '../../lib/api';
import { cn } from '../../lib/utils'; // Uses utility for styling if needed

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    category: string;
    merchant: string;
}

export function TransactionList() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        endpoints.getTransactions()
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading transactions...</div>;

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((tx) => (
                                <tr key={tx.id} className="bg-card border-b border-border hover:bg-muted/30">
                                    <td className="px-6 py-4 text-foreground">{tx.date}</td>
                                    <td className="px-6 py-4 font-medium text-foreground">{tx.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-medium",
                                        tx.amount < 0 ? "text-foreground" : "text-green-500"
                                    )}>
                                        ${Math.abs(tx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-6 py-4 text-center text-muted-foreground" colSpan={4}>No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
