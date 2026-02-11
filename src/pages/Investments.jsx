import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, PiggyBank, Briefcase, Landmark, Shield, Pencil } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function Investments({ user }) {
    const [investments, setInvestments] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        type: 'Poupanca',
        monthlyRate: '0.5'
    });

    const load = async () => {
        if (window.api) {
            const data = await window.api.getInvestments(user.id);
            setInvestments(data);
        }
    };

    useEffect(() => {
        load();
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (window.api) {
            if (editingId) {
                await window.api.updateInvestment(user.id, { ...formData, id: editingId });
            } else {
                await window.api.addInvestment(user.id, formData);
            }
            setFormVisible(false);
            setEditingId(null);
            setFormData({ name: '', amount: '', type: 'Poupanca', monthlyRate: '0.5' });
            load();
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            amount: item.amount,
            type: item.type,
            monthlyRate: item.monthlyRate || '0.5'
        });
        setFormVisible(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Remover investimento?")) {
            if (window.api) {
                await window.api.deleteInvestment(user.id, id);
                load();
            }
        }
    };

    // Calculate Projected Value
    const calculateProjected = (investment) => {
        const start = new Date(investment.createdAt);
        const now = new Date();
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

        // Simple Compound Interest: P * (1 + r)^t
        // Rate is monthly percentage
        const rate = parseFloat(investment.monthlyRate) / 100;
        const projected = investment.amount * Math.pow((1 + rate), Math.max(0, months));

        return projected;
    };

    const totalInvested = investments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalProjected = investments.reduce((acc, curr) => acc + calculateProjected(curr), 0);
    const totalProfit = totalProjected - totalInvested;

    // Chart Data
    const dataByType = investments.reduce((acc, curr) => {
        const existing = acc.find(i => i.name === curr.type);
        if (existing) {
            existing.value += Number(curr.amount);
        } else {
            acc.push({ name: curr.type, value: Number(curr.amount) });
        }
        return acc;
    }, []);

    const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899'];

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Poupanca': return <PiggyBank size={24} />;
            case 'CDB': return <Shield size={24} />;
            case 'Ações': return <Briefcase size={24} />;
            case 'FIIs': return <Landmark size={24} />;
            default: return <TrendingUp size={24} />;
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-24 max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-sky-400" size={32} /> Investimentos
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Acompanhe o crescimento do seu patrimônio.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormVisible(true); }} className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="hidden sm:inline">Novo Aporte</span>
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-sky-500/30 transition-all">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all"></div>
                    <p className="text-slate-400 font-medium mb-1">Total Investido</p>
                    <h2 className="text-3xl font-bold text-white font-mono">{totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <p className="text-slate-400 font-medium mb-1">Valor Atual Estimado</p>
                    <h2 className="text-3xl font-bold text-emerald-400 font-mono">{totalProjected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
                    <p className="text-slate-400 font-medium mb-1">Rendimento Total</p>
                    <h2 className="text-3xl font-bold text-amber-400 font-mono">+{totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Portfólio</h3>
                    {investments.map(item => {
                        const projected = calculateProjected(item);
                        const profit = projected - item.amount;
                        const profitPercent = (profit / item.amount) * 100;

                        return (
                            <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:bg-slate-800 transition-all group flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl text-sky-400 group-hover:bg-sky-500/20 group-hover:text-sky-300 transition-colors">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                        <div className="flex gap-2 text-sm text-slate-400">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{item.type}</span>
                                            <span>• {item.monthlyRate}% a.m.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 w-full md:w-auto">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Saldo Atual</p>
                                        <p className="text-xl font-bold text-white font-mono">{projected.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-500">Aporte: {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded">+{profitPercent.toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                                    <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-colors">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {investments.length === 0 && (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Comece a investir para ver seu dinheiro crescer.</p>
                        </div>
                    )}
                </div>

                {/* Allocation Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
                    <h3 className="text-xl font-bold text-white mb-6">Alocação</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dataByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dataByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                    formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Educational Tip */}
                    <div className="mt-6 bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl text-sm">
                        <h4 className="text-sky-400 font-bold mb-2 flex items-center gap-2">
                            💡 Dica Econômica
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                            Mantenha sempre uma <strong>Reserva de Emergência</strong> (equivalente a 6 meses de gastos) em investimentos de alta liquidez como a <strong>Poupança</strong> ou <strong>CDB</strong> antes de arriscar em Ações.
                        </p>
                    </div>
                </div>
            </div>

            {formVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar Investimento' : 'Novo Investimento'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Nome / Descrição</label>
                                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-sky-500/50 outline-none transition-colors" placeholder="Ex: Reserva NuBank" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Valor Aportado</label>
                                    <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-sky-500/50 outline-none transition-colors font-mono" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Rentabilidade Mensal (%)</label>
                                    <input required type="number" step="0.01" value={formData.monthlyRate} onChange={e => setFormData({ ...formData, monthlyRate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-sky-500/50 outline-none transition-colors" placeholder="0.5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Tipo de Ativo</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-sky-500/50 outline-none transition-colors appearance-none cursor-pointer">
                                    <option value="Poupanca">Poupança / Reserva</option>
                                    <option value="CDB">CDB / Renda Fixa LC</option>
                                    <option value="Ações">Ações / Variável</option>
                                    <option value="FIIs">Fundos Imobiliários</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setFormVisible(false)} className="flex-1 p-4 rounded-xl hover:bg-slate-800 text-slate-400 font-bold transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 p-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:to-sky-500 text-white font-bold shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    {editingId ? 'Salvar Alterações' : 'Confirmar Investimento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
