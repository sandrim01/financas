import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import {
    DollarSign, TrendingUp, TrendingDown, RefreshCcw, LayoutDashboard, Target, Trophy, FileDown, FileText
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { FinancialFeed } from '../components/FinancialFeed';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Dashboard({ user }) {
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [fixedExpenses, setFixedExpenses] = useState([]); // New
    const [fixedIncome, setFixedIncome] = useState([]); // New
    const [monthlyStatus, setMonthlyStatus] = useState({}); // New
    const [currentTime, setCurrentTime] = useState(new Date());
    const [upcomingBills, setUpcomingBills] = useState([]);
    const [showNotifications, setShowNotifications] = useState(true);
    const [showExportOptions, setShowExportOptions] = useState(false);

    // Comparison States
    const [comparisonData, setComparisonData] = useState({
        incomeChange: 0,
        expenseChange: 0,
        balanceChange: 0,
        lastMonthBalance: 0
    });

    // Recalculate comparison whenever transactions change
    useEffect(() => {
        if (transactions.length > 0) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const currentMonthTxs = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            const lastMonthTxs = transactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
            });

            const calcTotal = (txs, type) => txs.filter(t => t.type === type).reduce((acc, curr) => acc + Number(curr.amount), 0);

            const currentIncome = calcTotal(currentMonthTxs, 'income');
            const currentExpense = calcTotal(currentMonthTxs, 'expense');
            const lastIncome = calcTotal(lastMonthTxs, 'income');
            const lastExpense = calcTotal(lastMonthTxs, 'expense');

            const calculateChange = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            setComparisonData({
                incomeChange: calculateChange(currentIncome, lastIncome),
                expenseChange: calculateChange(currentExpense, lastExpense),
                balanceChange: calculateChange((currentIncome - currentExpense), (lastIncome - lastExpense)),
                lastMonthBalance: lastIncome - lastExpense
            });
        }
    }, [transactions]);

    // PDF Generation
    const generatePDF = (period) => {
        const doc = new jsPDF();
        const now = new Date();
        const title = period === 'month' ? `Relatório Mensal - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : `Relatório Anual - ${now.getFullYear()}`;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Emerald color
        doc.text("Finanças Pessoais", 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text(title, 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 14, 38);

        // Filter Data
        let filteredTxs = transactions;
        if (period === 'month') {
            filteredTxs = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else {
            filteredTxs = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === now.getFullYear();
            });
        }

        // Summary Statistics
        const income = filteredTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = filteredTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const balance = income - expense;

        doc.setDrawColor(200);
        doc.line(14, 42, 196, 42);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Resumo do Período:", 14, 50);

        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129); // Green
        doc.text(`Receitas: R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 58);

        doc.setTextColor(244, 63, 94); // Red
        doc.text(`Despesas: R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, 58);

        doc.setTextColor(0, 0, 0); // Black for balance
        doc.setFont(undefined, 'bold');
        doc.text(`Saldo: R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 66);
        doc.setFont(undefined, 'normal');

        // Table
        const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
        const tableRows = [];

        filteredTxs.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tx => {
            const txData = [
                new Date(tx.date).toLocaleDateString('pt-BR'),
                tx.title,
                tx.category || '-',
                tx.type === 'income' ? 'Receita' : 'Despesa',
                `R$ ${Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ];
            tableRows.push(txData);
        });

        // Use autoTable correctly
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] }, // Slate 900
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`Relatorio_${period === 'month' ? 'Mensal' : 'Anual'}_${now.getTime()}.pdf`);
        setShowExportOptions(false);
    };

    const load = async () => {
        if (user?.id) {
            try {
                const [txData, goalsData, fExpenses, fIncome, mStatus] = await Promise.all([
                    api.getTransactions(user.id).catch(() => []),
                    api.getGoals(user.id).catch(() => []),
                    api.getFixedExpenses(user.id).catch(() => []),
                    api.getFixedIncome(user.id).catch(() => []),
                    api.getMonthlyStatus(user.id).catch(() => ({}))
                ]);
                setTransactions(Array.isArray(txData) ? txData : []);
                setGoals(Array.isArray(goalsData) ? goalsData : []);
                setFixedExpenses(Array.isArray(fExpenses) ? fExpenses : []);
                setFixedIncome(Array.isArray(fIncome) ? fIncome : []);
                setMonthlyStatus(mStatus || {});
            } catch (error) {
                console.error("Failed to load data:", error);
                setTransactions([]);
                setGoals([]);
            }
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [user.id]);

    useEffect(() => {
        if (transactions.length > 0) {
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);

            const bills = transactions.filter(t => {
                if (t.type !== 'expense') return false;
                const tDate = new Date(t.date);
                // Check if due in the future but within 7 days
                return tDate >= now && tDate <= nextWeek;
            });
            setUpcomingBills(bills);
        }
    }, [transactions]);

    // Calculate totals
    const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = income - expense;

    // Calculate Pending (Forecast)
    const pendingExpense = fixedExpenses
        .filter(e => !monthlyStatus[e.id])
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const pendingIncome = fixedIncome
        .filter(i => !monthlyStatus[i.id])
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Process chart data
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartData = sortedTxs.reduce((acc, curr) => {
        const date = new Date(curr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const existing = acc.find(item => item.date === date);
        if (existing) {
            if (curr.type === 'income') existing.income += Number(curr.amount);
            else existing.expense += Number(curr.amount);
        } else {
            acc.push({
                date,
                income: curr.type === 'income' ? Number(curr.amount) : 0,
                expense: curr.type === 'expense' ? Number(curr.amount) : 0,
            });
        }
        return acc;
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 backdrop-blur-md p-4 border border-slate-700 rounded-xl shadow-2xl text-slate-200">
                    <p className="label font-bold mb-3 text-slate-400 text-xs uppercase tracking-wider">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.name === 'income' ? 'Entradas' : 'Saídas'}</span>
                            <span className="font-mono font-bold">R$ {entry.value.toLocaleString('pt-BR')}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-24 max-w-[1600px] mx-auto relative">
            {/* Notification Pop-up */}
            {showNotifications && upcomingBills.length > 0 && (
                <div className="fixed top-8 right-8 z-50 w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl animate-fade-in border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse box-shadow-glow"></span>
                            Contas da Semana
                        </h3>
                        <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-lg p-1">
                            <RefreshCcw className="rotate-45" size={16} /> {/* Using rotate as a close icon hack or just import X */}
                        </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {upcomingBills.map(bill => (
                            <div key={bill.id} className="flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                <div>
                                    <p className="text-slate-200 font-bold">{bill.title}</p>
                                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{new Date(bill.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</p>
                                </div>
                                <span className="text-rose-400 font-mono font-bold text-base">
                                    {Number(bill.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-emerald-500 hidden md:block" size={32} />
                        Visão Geral
                    </h1>
                    <div className="flex items-center gap-3 mt-2 text-slate-400">
                        <p className="text-lg">Comparativo com Mês Anterior</p>
                        <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-600"></span>
                        <p className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 text-sm md:text-base shadow-sm shadow-emerald-900/20">
                            {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 relative">
                    <div className="relative">
                        <button onClick={() => setShowExportOptions(!showExportOptions)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-95 shadow-lg shadow-black/20 flex items-center gap-2 font-bold focus:outline-none">
                            <FileDown size={20} /> <span className="hidden sm:inline">Relatórios</span>
                        </button>

                        {showExportOptions && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                                <button onClick={() => generatePDF('month')} className="w-full text-left p-3 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors border-b border-slate-800">
                                    <FileText size={16} /> Relatório Mensal (PDF)
                                </button>
                                <button onClick={() => generatePDF('year')} className="w-full text-left p-3 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-colors">
                                    <FileText size={16} /> Relatório Anual (PDF)
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={load} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-95 shadow-lg shadow-black/20">
                        <RefreshCcw size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group">
                    <StatCard
                        title="Saldo Total"
                        value={balance}
                        icon={DollarSign}
                        color="emerald"
                        trend={comparisonData.balanceChange}
                    />
                    {(pendingIncome > 0 || pendingExpense > 0) && (
                        <div className="mt-2 text-xs text-slate-400 px-2 flex justify-between">
                            <span>Previsto: R$ {(balance + pendingIncome - pendingExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <StatCard
                        title="Receitas"
                        value={income}
                        icon={TrendingUp}
                        color="cyan"
                        trend={comparisonData.incomeChange}
                    />
                    {pendingIncome > 0 && (
                        <div className="mt-2 text-xs text-emerald-400/70 px-2">
                            + R$ {pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <StatCard
                        title="Despesas"
                        value={expense}
                        icon={TrendingDown}
                        color="rose"
                        trend={comparisonData.expenseChange}
                    />
                    {pendingExpense > 0 && (
                        <div className="mt-2 text-xs text-rose-400/70 px-2">
                            + R$ {pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar
                        </div>
                    )}
                </div>
            </div>

            {/* Goals Section Summary */}
            {goals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="col-span-full flex items-center gap-2 mb-2">
                        <Target className="text-amber-400" size={20} />
                        <h2 className="text-xl font-bold text-white">Minhas Metas</h2>
                    </div>
                    {goals.slice(0, 4).map(goal => {
                        const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                        return (
                            <div key={goal.id} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:bg-slate-800/80 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                        <Trophy size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">{progress.toFixed(0)}%</span>
                                </div>
                                <h3 className="font-bold text-slate-200 text-sm mb-1 truncate">{goal.name}</h3>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 font-mono">
                                    R$ {Number(goal.currentAmount).toLocaleString('pt-BR')} / {Number(goal.targetAmount).toLocaleString('pt-BR', { notation: 'compact' })}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Charts and Recent Txs remain here... */}
                <div className="xl:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none transition-opacity duration-700 group-hover:opacity-75"></div>

                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h2 className="text-xl font-bold text-white">Fluxo de Caixa</h2>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Receita
                                <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span> Despesa
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#475569"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6ee7b7' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#fda4af' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col">
                    <FinancialFeed />

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col flex-1 min-h-[400px]">
                        <h2 className="text-xl font-bold text-white mb-6">Transações Recentes</h2>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            {sortedTxs.reverse().slice(0, 6).map((t, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-800/40 rounded-2xl hover:bg-slate-800 transition-all group cursor-default border border-transparent hover:border-slate-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl shadow-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-900/10' : 'bg-rose-500/10 text-rose-400 shadow-rose-900/10'}`}>
                                            {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors line-clamp-1">{t.title}</p>
                                            <p className="text-xs text-slate-500 font-medium">{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-mono font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                    <RefreshCcw size={40} className="mb-4" />
                                    <p>Sem dados ainda</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
