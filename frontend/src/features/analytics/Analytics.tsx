import { useEffect, useState } from 'react';
import { endpoints } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Filter, Brain, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';

export function Analytics() {
    const [data, setData] = useState<any[]>([]);
    const [mlData, setMlData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [years, setYears] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        // Fetch available years
        endpoints.getAvailableYears().then(res => {
            if (res.data.length > 0) {
                setYears(res.data);
                if (!res.data.includes(selectedYear)) setSelectedYear(res.data[0]);
            }
        }).catch(err => console.error("Failed to fetch years", err));
    }, []);

    useEffect(() => {
        setLoading(true);
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

        Promise.all([
            endpoints.getAnalytics({ year: selectedYear }),
            endpoints.getMLInsights({ year: selectedYear, month: currentMonth })
        ])
            .then(([resAnalytics, resML]) => {
                setData(resAnalytics.data);
                setMlData(resML.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedYear]);

    // Totals for cards
    const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
    const totalBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Financial Analytics</h2>
                    <p className="text-muted-foreground">Deep dive into your income vs expenses for {selectedYear}</p>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-lg border shadow-sm">
                    <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 text-foreground cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y} className="bg-background text-foreground">{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Income"
                    value={totalIncome}
                    icon={TrendingUp}
                    color="text-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Total Expenses"
                    value={totalExpense}
                    icon={TrendingDown}
                    color="text-red-accent"
                    loading={loading}
                />
                <StatCard
                    title="Net Balance"
                    value={totalBalance}
                    icon={Wallet}
                    color={totalBalance >= 0 ? "text-primary" : "text-red-accent"}
                    loading={loading}
                />
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Savings Rate
                    </h3>
                    {loading ? <Skeleton className="h-8 w-24 mt-2" /> : (
                        <p className={`text-2xl font-bold mt-2 ${savingsRate >= 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {savingsRate.toFixed(1)}%
                        </p>
                    )}
                </div>
            </div>

            {/* ML Insights Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Prediction Card */}
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        AI Prediction
                    </h3>
                    {loading || !mlData ? <Skeleton className="h-32 w-full" /> : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Forecast for Next Month</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    ${mlData.prediction.nextMonthAmount.toFixed(2)}
                                </p>
                            </div>
                            <div className={`flex items-center text-sm ${mlData.prediction.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                                {mlData.prediction.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                Trending {mlData.prediction.trend} ({(mlData.prediction.confidence * 100).toFixed(0)}% confidence)
                            </div>
                        </div>
                    )}
                </div>

                {/* Anomaly Detection */}
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-red-accent flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Anomalies
                    </h3>
                    {loading || !mlData ? <Skeleton className="h-32 w-full" /> : (
                        <div className="space-y-3">
                            {mlData.anomalies.length > 0 ? (
                                mlData.anomalies.map((a: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{a.category}</p>
                                            <p className="text-xs text-muted-foreground">Avg: ${a.average.toFixed(0)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-500">${a.amount.toFixed(0)}</p>
                                            <p className="text-xs text-red-400">+{a.zScore}σ</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                                    <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No anomalies detected</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Smart Budget */}
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
                        <Wallet className="w-5 h-5 mr-2" />
                        Smart Budget
                    </h3>
                    {loading || !mlData ? <Skeleton className="h-32 w-full" /> : (
                        <div>
                            <p className="text-sm font-medium mb-4">{mlData.budget.recommendation}</p>
                            <div className="space-y-2">
                                <BudgetBar label="Needs (50%)" value={mlData.budget.needs} total={mlData.budget.needs + mlData.budget.wants + mlData.budget.savings} color="bg-blue-500" />
                                <BudgetBar label="Wants (30%)" value={mlData.budget.wants} total={mlData.budget.needs + mlData.budget.wants + mlData.budget.savings} color="bg-purple-500" />
                                <BudgetBar label="Savings (20%)" value={mlData.budget.savings} total={mlData.budget.needs + mlData.budget.wants + mlData.budget.savings} color="bg-green-500" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-card rounded-xl shadow-sm border border-border h-[500px]">
                <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Income vs Expenses
                </h3>

                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(val: any) => {
                                    // val is YYYY-MM
                                    const [y, m] = val.split('-');
                                    // Use middle of month to avoid timezone shifts (e.g. Jan 1 -> Dec 31)
                                    const date = new Date(Number(y), Number(m) - 1, 15);
                                    return date.toLocaleDateString('en-US', { month: 'short' });
                                }}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="expense" name="Expense" fill="hsl(var(--red-accent))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-center text-muted-foreground py-20">No data available for this year.</p>
                )}
            </div>

            {/* Savings Line Graph */}
            <div className="p-6 bg-card rounded-xl shadow-sm border border-border h-[400px]">
                <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Monthly Savings Trend
                </h3>
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Skeleton className="h-[300px] w-full" />
                    </div>
                ) : data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(val: any) => {
                                    const [y, m] = val.split('-');
                                    const date = new Date(Number(y), Number(m) - 1, 15);
                                    return date.toLocaleDateString('en-US', { month: 'short' });
                                }}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(val) => `$${val}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                name="Savings"
                                stroke="hsl(var(--primary))"
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-center text-muted-foreground py-20">No data available for this year.</p>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, loading }: any) {
    return (
        <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Icon className={`w-4 h-4 mr-2 ${color}`} />
                {title}
            </h3>
            {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                <p className={`text-2xl font-bold mt-2 ${color}`}>
                    ${Math.abs(value).toFixed(2)}
                </p>
            )}
        </div>
    );
}

function BudgetBar({ label, value, total, color }: any) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span>{label}</span>
                <span>{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Safe date parsing for tooltip
        const [y, m] = label.split('-');
        const date = new Date(Number(y), Number(m) - 1, 15);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return (
            <div className="bg-card p-4 border border-border shadow-2xl rounded-xl text-sm font-mono ring-1 ring-border/50">
                <p className="font-semibold text-foreground mb-2 border-b border-border pb-1">{formattedDate}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="capitalize" style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-medium text-foreground">
                                ${Number(entry.value).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};
