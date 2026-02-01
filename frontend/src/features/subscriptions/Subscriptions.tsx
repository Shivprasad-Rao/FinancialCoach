import { useEffect, useState } from 'react';
import { endpoints } from '../../lib/api';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Subscription {
    merchant: string;
    amount: number;
    frequency: string;
    is_active: boolean;
    confidence?: number;
}

export function Subscriptions() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        endpoints.getSubscriptions()
            .then(res => setSubs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleFlag = (merchant: string) => {
        if (!confirm(`Are you sure you want to flag "${merchant}" as not a subscription?`)) return;

        endpoints.flagSubscription(merchant, true)
            .then(() => {
                setSubs(prev => prev.filter(s => s.merchant !== merchant));
            })
            .catch(console.error);
    };



    const totalMonthly = subs.reduce((acc, curr) => acc + curr.amount, 0);

    if (loading) return <div>Loading subscriptions...</div>;

    return (
        <div className="mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-blue-500">Subscriptions</h2>
                    <p className="mt-2 text-muted-foreground">
                        Recurring charges detected from your transactions.
                    </p>
                </div>
                <div className="bg-primary/20 px-6 py-4 rounded-xl text-center border border-primary/30">
                    <p className="text-sm text-foreground">Monthly Run Rate</p>
                    <p className="text-3xl font-bold text-primary">${totalMonthly.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subs.map((sub, idx) => (
                    <div key={idx} className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col justify-between transition-all hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-foreground">{sub.merchant}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{sub.frequency}</p>
                            </div>

                        </div>



                        <div className="mt-6 pt-6 border-t border-border flex items-end justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Cost</p>
                                <p className="text-xl font-bold text-foreground">${sub.amount.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => handleFlag(sub.merchant)}
                                className="text-sm text-destructive hover:underline"
                            >
                                Flag as error
                            </button>
                        </div>
                    </div>
                ))}

                {subs.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        No subscriptions detected yet. Upload more data!
                    </div>
                )}
            </div>
        </div>
    );
}
