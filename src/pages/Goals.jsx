import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Trophy, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

export function Goals({ user }) {
    const [goals, setGoals] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [addFundVisible, setAddFundVisible] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [fundAmount, setFundAmount] = useState('');
    const [formData, setFormData] = useState({ name: '', targetAmount: '', deadline: '' });

    const load = async () => {
        const data = await api.getGoals(user.id);
        setGoals(data);
    };

    useEffect(() => {
        load();
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.addGoal(user.id, formData);
        setFormVisible(false);
        setFormData({ name: '', targetAmount: '', deadline: '' });
        load();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Remover meta?")) {
            await api.deleteGoal(user.id, id);
            load();
        }
    };

    const openAddFund = (goal) => {
        setSelectedGoal(goal);
        setAddFundVisible(true);
        setFundAmount('');
    };

    const handleAddFund = async (e) => {
        e.preventDefault();
        if (!selectedGoal || !fundAmount) return;

        const newAmount = Number(selectedGoal.currentAmount) + Number(fundAmount);
        await api.updateGoal(user.id, selectedGoal.id, newAmount);
        // Optionally add a transaction for this?
        // await api.addTransaction({ title: `Depósito Meta: ${selectedGoal.name}`, amount: -Number(fundAmount), type: 'expense', category: 'Investimento/Meta', date: new Date().toISOString() });

        setAddFundVisible(false);
        load();
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-24 max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Target className="text-amber-400" size={32} /> Metas Financeiras
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Defina e acompanhe seus objetivos de longo prazo.</p>
                </div>
                <button onClick={() => setFormVisible(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="hidden sm:inline">Nova Meta</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                    return (
                        <div key={goal.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group hover:border-amber-500/30 transition-all hover:bg-slate-800/50 flex flex-col justify-between">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                        <Trophy size={24} />
                                    </div>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">{goal.name}</h3>
                                <p className="text-sm text-slate-500 mb-4">Meta: R$ {Number(goal.targetAmount).toLocaleString('pt-BR')}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-medium mb-1">
                                    <span className="text-slate-300">Progresso</span>
                                    <span className="text-amber-400">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>

                                {/* Detailed Plan Section */}
                                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 text-xs space-y-2 mt-4">
                                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Plano de Investimento</p>
                                    {goal.deadline ? (
                                        (() => {
                                            const today = new Date();
                                            const deadlineDate = new Date(goal.deadline);
                                            const monthsLeft = (deadlineDate.getFullYear() - today.getFullYear()) * 12 + (deadlineDate.getMonth() - today.getMonth());
                                            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                                            if (remaining <= 0) return <p className="text-emerald-400 font-bold">Meta atingida! 🎉</p>;
                                            if (deadlineDate < today) return <p className="text-rose-400 font-bold">Prazo expirado!</p>;

                                            const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Prazo:</span>
                                                        <span className="text-slate-300">{deadlineDate.toLocaleDateString()} ({Math.max(0, monthsLeft)} meses)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700/30">
                                                        <span className="text-amber-500 font-bold">Aporte Mensal:</span>
                                                        <span className="text-white font-mono font-bold">{monthlyNeeded.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <p className="text-slate-500 italic">Defina um prazo para ver o plano mensal.</p>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-800 mt-2">
                                    <span className="text-2xl font-bold font-mono text-white">
                                        R$ {Number(goal.currentAmount).toLocaleString('pt-BR')}
                                    </span>
                                    <button onClick={() => openAddFund(goal)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 font-bold text-xs flex items-center gap-1">
                                        <Plus size={14} /> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <Target size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhuma meta definida.</p>
                    </div>
                )}
            </div>

            {formVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-bold text-white mb-6">Nova Meta Financeira</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Objetivo</label>
                                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500/50 outline-none transition-colors" placeholder="Ex: Viagem Europa" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Valor Alvo</label>
                                <input required type="number" step="0.01" value={formData.targetAmount} onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500/50 outline-none transition-colors font-mono" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Prazo (Opcional)</label>
                                <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-amber-500/50 outline-none transition-colors text-slate-400" />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setFormVisible(false)} className="flex-1 p-4 rounded-xl hover:bg-slate-800 text-slate-400 font-bold transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">Definir Meta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {addFundVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-2">Adicionar Fundos</h2>
                        <p className="text-slate-400 mb-6 text-sm">Para: <span className="text-amber-400 font-bold">{selectedGoal?.name}</span></p>

                        <form onSubmit={handleAddFund} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Valor a depositar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                    <input required autoFocus type="number" step="0.01" value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-white focus:border-amber-500/50 outline-none transition-colors font-mono text-lg" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setAddFundVisible(false)} className="flex-1 p-3 rounded-xl hover:bg-slate-800 text-slate-400 font-bold transition-colors text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
