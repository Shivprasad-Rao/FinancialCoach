import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendsChartProps {
    data: Array<{ month: string; total: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const date = new Date(label + '-01');
        const formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return (
            <div className="bg-card p-3 border border-border shadow-xl rounded-lg text-sm font-mono">
                <p className="font-semibold text-foreground mb-1">{formattedDate}</p>
                <p className="text-muted-foreground">
                    Spending: <span className="font-medium text-[hsl(var(--blue))]">
                        ${payload[0].value.toFixed(2)}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

export function TrendsChart({ data }: TrendsChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                    <XAxis
                        dataKey="month"
                        interval={0}
                        tickFormatter={(value) => {
                            // value is "YYYY-MM"
                            // Manual parsing to avoid Timezone shifts (e.g. 2026-01-01 UTC -> 2025-12-31 Local)
                            const [_, m] = value.split('-');
                            const monthIndex = parseInt(m) - 1;
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return months[monthIndex] || value;
                        }}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                    <Bar
                        dataKey="total"
                        fill="url(#colorGradient)"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                    >
                    </Bar>
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--blue))" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="hsl(var(--blue))" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
