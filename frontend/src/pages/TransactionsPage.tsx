import { useEffect, useState } from 'react';
import { endpoints } from '../lib/api';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { AddTransaction } from '../features/transactions/AddTransaction';

export function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'add'>('list');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch all transactions
            const res = await endpoints.getTransactions();
            // Explicitly sort by date DESC (latest first)
            const sorted = res.data.sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setTransactions(sorted);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return;
        try {
            await endpoints.resetData();
            fetchTransactions();
        } catch (err) {
            console.error('Failed to reset data', err);
            // setError('Failed to reset data.'); // setError not defined, removing or I need to define state. 
            // Just console error is fine for MVP or alert.
            alert('Failed to reset data');
        }
    };

    if (loading) return <div>Loading transactions...</div>;

    return (
        <div className="space-y-6 animate-in fade-in relative">
            {/* Modal Overlay */}
            {view === 'add' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-2">
                            <AddTransaction
                                onCancel={() => setView('list')}
                                onSuccess={() => {
                                    setView('list');
                                    fetchTransactions();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-blue-500">Transactions</h2>
                    <p className="text-muted-foreground">View and manage your financial transactions.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 border border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive h-10 px-4 py-2"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Data
                    </button>
                    <button
                        onClick={() => setView('add')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1); // Reset to page 1 on limit change
                        }}
                        className="rounded-md border-input shadow-sm focus:border-primary focus:ring-primary text-sm p-1 bg-card text-foreground"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={transactions.length}>All</option>
                    </select>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
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
                            {currentTransactions.length > 0 ? (
                                currentTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-border hover:bg-muted/30">
                                        <td className="px-6 py-4 text-foreground">{format(new Date(tx.date), 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-foreground">{tx.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${tx.amount < 0 ? 'text-destructive' : 'text-green-500'}`}>
                                            {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                        No transactions found. Click "Add Transaction" to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {transactions.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} results
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm rounded-md bg-card border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted text-foreground"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-foreground self-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm rounded-md bg-card border border-input disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted text-foreground"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
