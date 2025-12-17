import React from 'react';
import { LayoutDashboard, Target, CheckSquare, Library, Users, Settings, Sun, Moon, LogOut, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
// import { useOKRStore } from '@/store/useOKRStore';

interface SidebarProps {
    currentView: string;
    onChangeView: (view: string) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
    const [isDark, setIsDark] = React.useState(true);
    // Simple single-org view
    // const { organizationId, nodes } = useOKRStore();

    // We can try to fetch the org name from the store if we had it, 
    // or just show generic "My Organization" for now to keep it simple and robust.
    const orgName = "OKR Focus";

    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'okrs', icon: Target, label: 'OKRs' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'scheduling', icon: Calendar, label: 'Scheduling' },
        { id: 'library', icon: Library, label: 'Library' },
        { id: 'organization', icon: Users, label: 'Organization' },
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-card border-r border-border text-card-foreground">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                        {orgName[0]}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-none">{orgName}</h2>
                        <p className="text-xs text-muted-foreground mt-1">Organization</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={cn(
                            "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            currentView === item.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", currentView === item.id ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                <button
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                    <span className="flex items-center">
                        {isDark ? <Moon className="mr-3 h-5 w-5" /> : <Sun className="mr-3 h-5 w-5" />}
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                </button>

                <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                </button>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
