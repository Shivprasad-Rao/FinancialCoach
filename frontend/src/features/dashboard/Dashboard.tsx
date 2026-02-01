import { useEffect, useState } from 'react';
import { endpoints } from '../../lib/api';
import { SpendingChart } from './SpendingChart.tsx';
import { TrendsChart } from './TrendsChart';
import { GoalRings } from './GoalRings';
import { Skeleton } from '../../components/ui/skeleton';
import { Sparkles, TrendingUp, PieChart as PieIcon, Filter, Target, AlertCircle } from 'lucide-react';

export function Dashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<{ insights: any[], advice: string } | null>(null);

    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingAnalysis, setLoadingAnalysis] = useState(true);

    // Filters
    const currentYear = new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(''); // Empty = All months
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    useEffect(() => {
        // Fetch available years
        endpoints.getAvailableYears()
            .then(res => {
                if (res.data.length > 0) {
                    setAvailableYears(res.data);
                    // If current selected year is not in list (and list exists), default to latest
                    if (!res.data.includes(selectedYear)) {
                        setSelectedYear(res.data[0]);
                    }
                } else {
                    // Fallback if no data
                    setAvailableYears([currentYear]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch years:", err);
                setAvailableYears([currentYear]);
            });

        // Fetch Goals and Subscriptions are now handled in the main aggregated call
        // Separate calls removed
    }, []);

    useEffect(() => {
        // Fetch All Dashboard Data (Summary, Trends, Goals, Subscriptions)
        const loadDashboardData = async () => {
            setLoadingSummary(true);
            try {
                // Single API Call
                const res = await endpoints.getDashboardData({ year: selectedYear, month: selectedMonth });

                const { summary, trends, goals, subscriptions } = res.data;

                setSummary(summary);
                setTrends(trends);
                setGoals(goals);
                setSubscriptions(subscriptions);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoadingSummary(false);
            }
        };

        if (selectedYear) {
            loadDashboardData();
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        // Insights fetched once on load (or could be refetched if backend supported filtered insights)
        endpoints.getInsights()
            .then(res => setAnalysis(res.data))
            .catch(console.error)
            .finally(() => setLoadingAnalysis(false));
    }, []);

    // Calculate totals
    const totalSpent = summary?.breakdown?.reduce((acc: number, curr: any) => acc + Math.abs(curr.total), 0) || 0;
    const activeSubsCount = subscriptions.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header & Global Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight dark:text-blue-500">Dashboard</h2>
                    <p className="text-gray-400">Your financial overview for {selectedYear}</p>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-lg border shadow-sm">
                    <Filter className="w-4 h-4 ml-2 text-gray-400" />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium focus:ring-0 text-foreground cursor-pointer"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year} className="bg-background text-foreground">{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Total Spend */}
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Spending</h3>
                    {loadingSummary ? <Skeleton className="h-8 w-32 mt-2 bg-muted" /> : <p className="text-2xl font-bold mt-2 text-red-accent">${totalSpent.toFixed(2)}</p>}
                </div>

                {/* Active Subscriptions */}
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">Detected Subscriptions</h3>
                    <p className="text-2xl font-bold mt-2 text-foreground">{activeSubsCount}</p>
                </div>

                {/* Smart Insights Stat */}
                <div className="p-6 bg-gradient-to-br from-[hsl(var(--blue))] to-indigo-600 rounded-xl shadow-sm text-white">
                    <h3 className="text-sm font-medium text-blue-100">Smart Insights</h3>
                    {loadingAnalysis ? <Skeleton className="h-8 w-24 mt-2 bg-white/20 dark:bg-white/20" /> : <p className="text-2xl font-bold mt-2">{analysis?.insights?.length || 0} Alerts</p>}
                </div>
            </div>

            {/* Advice Section */}
            <div className="p-6 bg-card/50 border border-primary/20 rounded-xl">
                <h3 className="text-lg font-semibold text-primary flex items-center mb-2">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Coach's Advice
                </h3>
                {loadingAnalysis ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-muted" />
                        <Skeleton className="h-4 w-3/4 bg-muted" />
                    </div>
                ) : (
                    <p className="text-foreground leading-relaxed">
                        {analysis?.advice || "No advice available yet. Upload more data!"}
                    </p>
                )}
            </div>

            {/* Middle Grid: Pie Chart + Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

                {/* Pie Chart (70% -> col-span-7) */}
                <div className="lg:col-span-7 p-6 bg-card rounded-xl shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center text-foreground">
                            <PieIcon className="w-5 h-5 mr-2 text-primary" />
                            Spending by Category
                        </h3>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-input p-1 rounded-md text-sm font-medium focus:ring-0 text-foreground bg-background cursor-pointer"
                        >
                            <option value="" className="bg-background text-foreground">Full Year</option>
                            <option value="01" className="bg-background text-foreground">January</option>
                            <option value="02" className="bg-background text-foreground">February</option>
                            <option value="03" className="bg-background text-foreground">March</option>
                            <option value="04" className="bg-background text-foreground">April</option>
                            <option value="05" className="bg-background text-foreground">May</option>
                            <option value="06" className="bg-background text-foreground">June</option>
                            <option value="07" className="bg-background text-foreground">July</option>
                            <option value="08" className="bg-background text-foreground">August</option>
                            <option value="09" className="bg-background text-foreground">September</option>
                            <option value="10" className="bg-background text-foreground">October</option>
                            <option value="11" className="bg-background text-foreground">November</option>
                            <option value="12" className="bg-background text-foreground">December</option>
                        </select>
                    </div>

                    {loadingSummary ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Skeleton className="h-64 w-64 rounded-full" />
                        </div>
                    ) : summary?.breakdown?.length > 0 ? (
                        <SpendingChart data={summary.breakdown} />
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                            <p>No spending data found for this period.</p>
                        </div>
                    )}
                </div>

                {/* Insights Column (30% -> col-span-3) */}
                <div className="lg:col-span-3 flex flex-col h-full bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold text-foreground">AI Spotlights</h3>
                    </div>

                    <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {loadingAnalysis ? (
                            <>
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                            </>
                        ) : (analysis?.insights?.length || 0) > 0 ? (
                            analysis?.insights.map((insight: any) => {
                                // Local state for hidden/flagged items would be better in a sub-component, 
                                // but for inline map, let's use a simple approach or just fire-and-forget for now.
                                // React pattern: Extract to component or accept simple alert.

                                return (
                                    <div key={insight.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg relative group transition-all hover:shadow-sm">
                                        <button
                                            onClick={(e) => {
                                                e.currentTarget.style.color = 'red';
                                                endpoints.flagInsight(insight.id, "User flagged as error");
                                                alert("Thanks for the feedback! We will improve this insight.");
                                            }}
                                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Flag as incorrect"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">{insight.type}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1">{insight.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{insight.message}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-10">No alerts needed! You're doing great.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Grid: Goals (30%) + Trends (70%) */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

                {/* Active Goals (30% -> col-span-3) */}
                <div className="lg:col-span-3 p-6 bg-card rounded-xl shadow-sm border border-border flex flex-col">
                    <h3 className="text-lg font-semibold flex items-center mb-4 text-foreground">
                        <Target className="w-5 h-5 mr-2 text-primary" />
                        Saving Goals
                    </h3>
                    <div className="flex-1">
                        <GoalRings goals={goals.filter(g => g.current_amount < g.target_amount)} />
                    </div>
                </div>

                {/* Trends Bar Graph (70% -> col-span-7) */}
                <div className="lg:col-span-7 p-6 bg-card rounded-xl shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center text-foreground">
                            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                            Monthly Trends ({selectedYear})
                        </h3>
                    </div>
                    {loadingSummary ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Skeleton className="h-64 w-full rounded-md" />
                        </div>
                    ) : trends.length > 0 ? (
                        <TrendsChart data={trends} />
                    ) : (
                        <p className="text-gray-500 h-[300px] flex items-center justify-center">No trend data available for {selectedYear}</p>
                    )}
                </div>

            </div>

        </div>
    );
}
