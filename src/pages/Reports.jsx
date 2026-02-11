import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon, TrendingDown } from 'lucide-react';

export function Reports({ user }) {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const load = async () => {
            if (window.api) {
                const data = await window.api.getTransactions(user.id);
                setTransactions(data);
            }
        };
        load();
    }, [user.id]);

    // Process data for Pie Chart (Expenses by Category)
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const data = expenses.reduce((acc, curr) => {
        const category = curr.category || 'Outros';
        const existing = acc.find(i => i.name === category);
        if (existing) existing.value += Number(curr.amount);
        else acc.push({ name: category, value: Number(curr.amount) });
        return acc;
    }, []).sort((a, b) => b.value - a.value);

    // Modern vibrant palette
    const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#6366f1'];

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-24">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <PieIcon className="text-violet-500" size={32} /> Relatórios
                </h1>
                <p className="text-slate-400 mt-2 text-lg">Análise visual dos seus gastos por categoria.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Card */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-white">Distribuição de Despesas</h2>
                        <div className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-sm font-bold flex items-center gap-2">
                            <TrendingDown size={14} />
                            Total: R$ {totalExpenses.toFixed(2)}
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px] flex items-center justify-center relative z-10">
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={6}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', color: '#fff', padding: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(value) => `R$ ${value.toFixed(2)}`}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry) => <span className="text-slate-300 ml-2 font-medium">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-slate-500 flex flex-col items-center">
                                <PieIcon size={48} className="opacity-20 mb-4" />
                                <p>Sem dados suficientes para o gráfico.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details List */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col h-full">
                    <h2 className="text-2xl font-bold text-white mb-8">Detalhamento</h2>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {data.map((item, index) => {
                            const percent = ((item.value / totalExpenses) * 100).toFixed(1);
                            return (
                                <div key={index} className="group flex items-center justify-between p-5 bg-slate-800/40 rounded-2xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                            {percent}%
                                        </div>
                                        <div>
                                            <span className="block font-bold text-white text-lg group-hover:translate-x-1 transition-transform">{item.name}</span>
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold font-mono text-slate-300 text-lg">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            );
                        })}
                        {data.length === 0 && (
                            <p className="text-slate-500 text-center py-12">Nenhuma despesa registrada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
