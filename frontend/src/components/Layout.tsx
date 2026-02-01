import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, CreditCard, Target, Sparkles, BarChart2, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { theme, setTheme } = useTheme();

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

                <nav className="flex-1 px-4 space-y-2">
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

                <div className="p-4 border-t border-border">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-4"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <div className="bg-red-accent rounded-lg p-4 text-white">
                        <h3 className="text-sm font-semibold">Hackathon Mode</h3>
                        <p className="text-xs text-white/80 mt-1">Local Data Storage Only</p>
                    </div>
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
