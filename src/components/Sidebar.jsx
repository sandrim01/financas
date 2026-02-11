import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, Settings, CalendarClock, Target, TrendingUp, Briefcase, LogOut, User, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Sidebar({ user, onLogout }) {
    const links = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/transactions', icon: Wallet, label: 'Transações' },
        { to: '/fixed-expenses', icon: CalendarClock, label: 'Despesas Fixas' },
        { to: '/fixed-income', icon: TrendingUp, label: 'Rendimentos Fixos' },
        { to: '/investments', icon: Briefcase, label: 'Investimentos' },
        { to: '/goals', icon: Target, label: 'Metas' },
        { to: '/reports', icon: PieChart, label: 'Relatórios' },
    ];

    if (user && user.email === 'aless0791naval@gmail.com') {
        links.push({ to: '/admin-users', icon: Shield, label: 'Admin' });
    }

    return (
        <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 transition-all duration-300 h-screen sticky top-0 md:justify-between">
            <div>
                <div className="flex items-center gap-3 px-2 mb-8 select-none app-drag-region">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                        <span className="font-bold text-slate-900 text-xl">F</span>
                    </div>
                    <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 hidden md:block tracking-tight text-nowrap">
                        Finanças
                    </span>
                </div>

                <nav className="space-y-2 flex-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-slate-800 text-emerald-400 shadow-inner shadow-black/20"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    )}
                                    <link.icon size={22} className={cn("transition-transform duration-300 group-hover:scale-110 shrink-0", isActive && "text-emerald-400")} />
                                    <span className="font-medium hidden md:block text-sm overflow-hidden text-ellipsis whitespace-nowrap">{link.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-800/50 space-y-2">
                {user && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl mb-2 overflow-hidden border border-slate-700/30">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 shrink-0">
                            <User size={18} />
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <p className="text-sm font-bold text-slate-200 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 p-3 w-full text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all group"
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className="font-medium hidden md:block text-sm">Sair</span>
                </button>
            </div>
        </aside>
    );
}
