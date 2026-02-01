import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyChartProps {
    data: Array<{ month: string; total: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const [year, month] = label.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const formattedDate = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });

        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 shadow-lg rounded-xl">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{formattedDate}</p>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ${Number(payload[0].value).toFixed(2)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export function MonthlyChart({ data }: MonthlyChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                        tickFormatter={(value) => {
                            const [year, month] = value.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1);
                            return date.toLocaleString('default', { month: 'short' });
                        }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar
                        dataKey="total"
                        fill="#4F46E5"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                        activeBar={{ fill: '#4338ca' }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
