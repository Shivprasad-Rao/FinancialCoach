import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, CreditCard, Target, Sparkles, BarChart2, Sun, Moon, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { logout, user } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: BarChart2 },
        { name: 'Transactions', path: '/transactions', icon: Upload },
        { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
        { name: 'Goals', path: '/goals', icon: Target },
        { name: 'Ask Advisor', path: '/advisor', icon: Sparkles },
    ];

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-red-accent">
                        FinCoach
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Smart Financial Companion</p>
                </div>

                {user && (
                    <div className="px-6 pb-4 mb-2 border-b border-border/50">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                            <div className="bg-primary/20 p-2 rounded-full">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.username}</p>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border space-y-2">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside >

            {/* Main Content */}
            < main className="flex-1 overflow-auto bg-background" >
                <header className="h-16 bg-card border-b border-border flex items-center px-8 justify-between md:hidden">
                    <h1 className="text-lg font-bold">FinCoach</h1>
                    {/* Mobile menu toggle would go here */}
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main >
        </div >
    );
}
