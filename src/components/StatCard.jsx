import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function StatCard({ title, value, icon: Icon, color = 'emerald', trend }) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    };

    const style = colors[color] || colors.emerald;

    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className={cn("bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 group relative overflow-hidden")}>
            <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700", style.replace('text-', 'bg-'))}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-1 group-hover:bg-gradient-to-r from-white to-slate-400 bg-clip-text transition-all">{formattedValue}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", style)}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2 text-sm relative z-10">
                    <span className={cn("font-bold", trend > 0 ? "text-emerald-400" : "text-rose-400")}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-slate-500">em relação ao mês anterior</span>
                </div>
            )}
        </div>
    );
}
