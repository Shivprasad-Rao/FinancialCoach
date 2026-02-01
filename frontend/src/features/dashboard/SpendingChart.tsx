import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';


interface SpendingChartProps {
    data: Array<{ category: string; total: number }>;
}

// Multi-colored Palette
const COLORS = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-card p-3 border border-border shadow-xl rounded-lg text-sm font-mono">
                <p className="font-semibold mb-1" style={{ color: data.payload.fill }}>{data.name}</p>
                <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                        ${parseFloat(data.value).toFixed(2)}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

export function SpendingChart({ data }: SpendingChartProps) {
    // Aggregate small values into "Others"
    const totalAmount = data.reduce((sum, item) => sum + Math.abs(item.total), 0);
    const threshold = 0.015; // 1.5%

    let chartData = data.map(d => ({
        name: d.category,
        value: Math.abs(d.total)
    })).sort((a, b) => b.value - a.value);

    const mainCategories = chartData.filter(d => d.value / totalAmount >= threshold);
    const smallCategories = chartData.filter(d => d.value / totalAmount < threshold);

    if (smallCategories.length > 0) {
        const othersTotal = smallCategories.reduce((sum, d) => sum + d.value, 0);
        mainCategories.push({ name: 'Others', value: othersTotal });
    }



    // Custom Legend to allow scrolling
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="h-full max-h-[300px] overflow-y-auto pl-6 pr-2 custom-scrollbar">
                <ul className="space-y-4">
                    {payload.map((entry: any, index: number) => {
                        const percent = ((entry.payload.value / totalAmount) * 100).toFixed(0);


                        return (
                            <li key={`item-${index}`} className="flex items-center justify-between group">
                                <div className="flex items-center flex-1 min-w-0 gap-3">
                                    {/* Name + Bar */}
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex justify-between items-baseline mb-1.5">
                                            <span className="font-semibold text-foreground text-sm truncate">{entry.value}</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-1/2">
                                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%`, backgroundColor: entry.color }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground w-6">{percent}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <span className="block font-bold text-foreground text-xs">${entry.payload.value.toFixed(0)}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                        data={mainCategories}
                        cx="50%" // Center the pie chart
                        cy="50%"
                        innerRadius={80} // Slightly smaller inner to balance visual weight
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                        dataKey="value"
                        cornerRadius={4}
                    >
                        {mainCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        content={renderLegend}
                        wrapperStyle={{ width: '45%' }} // Give legend more space
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
