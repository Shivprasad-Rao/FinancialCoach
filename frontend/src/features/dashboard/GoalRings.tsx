

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
}

interface GoalRingsProps {
    goals: Goal[];
}

const COLORS = [
    '#FF4081', // Pink
    '#00E676', // Green
    '#2979FF', // Blue
    '#FFC400', // Yellow
];

export function GoalRings({ goals }: GoalRingsProps) {
    // If no goals, show empty state
    if (goals.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No active goals.
            </div>
        );
    }

    // Limit to 4 for visual balance (2x2 grid)
    const displayGoals = goals.slice(0, 4);

    return (
        <div className="grid grid-cols-2 gap-4 h-full items-center justify-center p-2">
            {displayGoals.map((goal, index) => {
                const percent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                const color = COLORS[index % COLORS.length];
                const radius = 52; // Increased radius
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percent / 100) * circumference;

                return (
                    <div key={goal.id} className="flex flex-col items-center">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Background Circle */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="transparent"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="64"
                                    cy="64"
                                    r={radius}
                                    stroke={color}
                                    strokeWidth="10"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            {/* Percentage Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold" style={{ color: color }}>
                                    {Math.round(percent)}%
                                </span>
                            </div>
                        </div>
                        {/* Goal Name */}
                        <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center max-w-[120px]">
                            {goal.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
