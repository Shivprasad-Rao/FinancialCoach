import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { endpoints } from '../../lib/api';
import { cn } from '../../lib/utils';

interface AddTransactionProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function AddTransaction({ onCancel, onSuccess }: AddTransactionProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ count: number } | null>(null);

    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
    const [categories, setCategories] = useState<string[]>([]);

    // Manual Form State
    const [manualData, setManualData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        type: 'expense'
    });

    useEffect(() => {
        // Fetch categories on mount
        endpoints.getCategories().then(res => {
            setCategories(res.data);
            if (res.data.length > 0) setManualData(prev => ({ ...prev, category: res.data[0] }));
        }).catch(err => console.error("Failed to load categories", err));
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            try {
                const res = await endpoints.uploadTransactions(text);
                if (res.data.success) {
                    setSuccessData({ count: res.data.count });
                    setUploading(false);
                    // Automatically go back after success
                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to upload file. Please check format.');
                setUploading(false);
            }
        };

        reader.readAsText(file);
    }, [onSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        maxFiles: 1
    });

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            await endpoints.addManualTransaction({
                ...manualData,
                amount: parseFloat(manualData.amount)
            });
            setSuccessData({ count: 1 });
            setUploading(false);
            setTimeout(() => onSuccess(), 1500);
        } catch (err) {
            console.error(err);
            setError('Failed to add transaction.');
            setUploading(false);
        }
    };

    if (successData) {
        return (
            <div className="max-w-xl mx-auto mt-10 text-center space-y-6 animate-in fade-in zoom-in">
                <div className="mx-auto w-24 h-24 bg-green-900/40 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Success!</h2>
                <p className="text-lg text-muted-foreground">
                    {activeTab === 'upload' ? `Imported ${successData.count} transactions.` : 'Transaction added successfully.'}
                </p>
                <div className="flex justify-center">
                    <button
                        onClick={onSuccess}
                        className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg text-sm font-medium transition-colors text-foreground"
                    >
                        Back to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 min-h-[500px]">
            <div className="flex items-center mb-6">
                <button
                    onClick={onCancel}
                    className="mr-4 p-2 rounded-full hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Transactions</h2>
                    <p className="text-sm text-muted-foreground">Upload a CSV file or manually enter details.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-lg mb-8">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        activeTab === 'upload' ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Upload CSV
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                        activeTab === 'manual' ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Manual Entry
                </button>
            </div>

            {activeTab === 'upload' ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
                        isDragActive
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary hover:bg-muted",
                        uploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-primary/20 rounded-full">
                            {uploading ? (
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <UploadIcon className="w-8 h-8 text-primary" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-lg font-medium text-foreground">
                                {uploading ? 'Processing transaction data...' : isDragActive ? 'Drop file here' : 'Click to upload CSV'}
                            </p>
                            <p className="text-sm text-muted-foreground">Max 10MB</p>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                            <select
                                value={manualData.type}
                                onChange={e => setManualData({ ...manualData, type: e.target.value })}
                                className="w-full border-input rounded-lg shadow-sm focus:border-primary focus:ring-primary bg-secondary p-2 text-foreground"
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={manualData.date}
                                onChange={e => setManualData({ ...manualData, date: e.target.value })}
                                className="w-full border-input rounded-lg shadow-sm focus:border-primary focus:ring-primary bg-secondary p-2 text-foreground"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Starbucks, Salary, Rent"
                            value={manualData.description}
                            onChange={e => setManualData({ ...manualData, description: e.target.value })}
                            className="w-full border-input rounded-lg shadow-sm focus:border-primary focus:ring-primary bg-secondary p-2 text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={manualData.amount}
                                onChange={e => setManualData({ ...manualData, amount: e.target.value })}
                                className="w-full border-input rounded-lg shadow-sm focus:border-primary focus:ring-primary bg-secondary p-2 text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                            <select
                                value={manualData.category}
                                onChange={e => setManualData({ ...manualData, category: e.target.value })}
                                className="w-full border-input rounded-lg shadow-sm focus:border-primary focus:ring-primary bg-secondary p-2 text-foreground"
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-secondary hover:bg-muted text-foreground font-medium py-2 px-4 rounded-lg shadow-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                        >
                            {uploading ? 'Add...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            )}

            {error && (
                <div className="mt-6 p-4 bg-destructive/20 text-destructive rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}
        </div>
    );
}
