import { useEffect, useState } from 'react';
import { endpoints } from '../../lib/api';
import { Target, Plus, TrendingUp, CheckCircle, Trash2, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
}

export function Goals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    // Delete Modal State
    const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');

    const fetchGoals = () => {
        endpoints.getGoals()
            .then(res => setGoals(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await endpoints.createGoal({
                name,
                target_amount: parseFloat(target),
                deadline
            });
            setShowForm(false);
            setName('');
            setTarget('');
            setDeadline('');
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    const updateProgress = async (id: number, current: number, add: number) => {
        try {
            await endpoints.updateGoal(id, current + add);
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = async () => {
        if (!goalToDelete) return;
        try {
            await endpoints.deleteGoal(goalToDelete);
            setGoalToDelete(null);
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Loading goals...</div>;

    const activeGoals = goals.filter(g => g.current_amount < g.target_amount);
    const completedGoals = goals.filter(g => g.current_amount >= g.target_amount);
    const displayedGoals = activeTab === 'active' ? activeGoals : completedGoals;

    return (
        <div className="mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-blue-500">Savings Goals</h2>
                    <p className="mt-2 text-muted-foreground">Track your progress for big purchases.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Goal
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-xl mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('active')}
                    className={cn(
                        "px-6 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === 'active'
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Active ({activeGoals.length})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={cn(
                        "px-6 py-2 text-sm font-medium rounded-lg transition-all",
                        activeTab === 'completed'
                            ? "bg-card text-green-500 shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Completed ({completedGoals.length})
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreate} className="bg-card p-8 rounded-2xl shadow-xl border border-border w-full max-w-lg relative animate-in zoom-in-95 duration-200">
                        <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X className="w-6 h-6" />
                        </button>
                        <h3 className="font-bold text-2xl mb-6 text-foreground">Create New Goal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Goal Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Trip"
                                    className="w-full border border-input rounded-lg p-3 bg-secondary text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    value={name} onChange={e => setName(e.target.value)} required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-foreground">Target Amount</label>
                                    <input
                                        type="number"
                                        placeholder="$"
                                        className="w-full border border-input rounded-lg p-3 bg-secondary text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={target} onChange={e => setTarget(e.target.value)} required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-foreground">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-input rounded-lg p-3 bg-secondary text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={deadline} onChange={e => setDeadline(e.target.value)} required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg font-medium">Cancel</button>
                            <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 font-medium shadow-sm">Create Goal</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {displayedGoals.map(goal => {
                    const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
                    const isCompleted = goal.current_amount >= goal.target_amount;

                    return (
                        <div key={goal.id} className={cn(
                            "bg-card p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-full group relative transition-all hover:shadow-md",
                            isCompleted && "border-green-900/50 bg-green-900/10"
                        )}>
                            {/* Delete Button (Hover) */}
                            <button
                                onClick={() => setGoalToDelete(goal.id)}
                                className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 rounded-full"
                                title="Delete Goal"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div>
                                <div className="flex justify-between items-start mb-4 pr-8">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center text-foreground">
                                            <Target className={cn("w-5 h-5 mr-2", isCompleted ? "text-green-500" : "text-primary")} />
                                            {goal.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">Target: {goal.deadline}</p>
                                    </div>
                                </div>

                                <div className="text-right mb-2">
                                    <p className="text-2xl font-bold text-foreground">${goal.current_amount.toFixed(0)} <span className="text-sm text-muted-foreground font-normal">/ ${goal.target_amount.toLocaleString()}</span></p>
                                </div>

                                <div className="w-full bg-secondary rounded-full h-3 mb-6 overflow-hidden">
                                    <div
                                        className={cn("h-3 rounded-full transition-all duration-1000 ease-out", isCompleted ? "bg-green-500" : "bg-primary")}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {!isCompleted ? (
                                <div className="flex gap-2 pt-4 border-t border-border">
                                    <button
                                        onClick={() => updateProgress(goal.id, goal.current_amount, 50)}
                                        className="flex-1 text-sm font-medium border border-input rounded-lg px-3 py-2 hover:bg-secondary flex items-center justify-center transition-colors text-foreground"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-1.5 text-green-500" />
                                        +$50
                                    </button>
                                    <button
                                        onClick={() => updateProgress(goal.id, goal.current_amount, 100)}
                                        className="flex-1 text-sm font-medium border border-input rounded-lg px-3 py-2 hover:bg-secondary flex items-center justify-center transition-colors text-foreground"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-1.5 text-green-500" />
                                        +$100
                                    </button>
                                    <button
                                        onClick={() => {
                                            const diff = goal.target_amount - goal.current_amount;
                                            updateProgress(goal.id, goal.current_amount, diff);
                                        }}
                                        className="p-2 text-green-500 hover:bg-green-900/20 rounded-lg border border-transparent hover:border-green-900/50 transition-colors"
                                        title="Mark as Done"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-border flex items-center justify-center text-green-500 font-medium">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Goal Completed!
                                </div>
                            )}
                        </div>
                    );
                })}

                {displayedGoals.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground">No {activeTab} goals found</p>
                        <p className="text-sm mt-1">Create a new goal to get started!</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {goalToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-sm text-center animate-in zoom-in-95 duration-200 border border-border">
                        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Delete Goal?</h3>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to delete this goal? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setGoalToDelete(null)}
                                className="px-5 py-2.5 rounded-xl border border-input text-foreground font-medium hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 shadow-sm transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
