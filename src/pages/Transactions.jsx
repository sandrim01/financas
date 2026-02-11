import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter, Pencil } from 'lucide-react';
import { api } from '../services/api';

export function Transactions({ user }) {
    const [transactions, setTransactions] = useState([]);
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });

    const load = async () => {
        try {
            const data = await api.getTransactions(user.id);
            setTransactions(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            console.error("Error loading transactions", error);
        }
    };

    useEffect(() => {
        load();
    }, [user.id]);

    const handleEdit = (t) => {
        setEditingId(t.id);
        setFormData({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date.split('T')[0]
        });
        setFormVisible(true);
    };

    const cancelEdit = () => {
        setFormVisible(false);
        setEditingId(null);
        setFormData({ title: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            await api.updateTransaction(user.id, { ...formData, id: editingId });
        } else {
            await api.addTransaction(user.id, formData);
        }
        cancelEdit();
        load();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir?")) {
            await api.deleteTransaction(user.id, id);
            load();
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 pb-24 max-w-[1200px] mx-auto animate-fade-in h-[calc(100vh-2rem)] flex flex-col">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Transações</h1>
                    <p className="text-slate-400 mt-1">Gerencie suas entradas e saídas.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormVisible(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="hidden sm:inline">Nova Transação</span>
                </button>
            </header>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-50"></div>
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input type="text" placeholder="Buscar transação..." className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-emerald-500/50 focus:bg-slate-800/80 outline-none transition-all placeholder:text-slate-600" />
                    </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold border-b border-slate-700">Data</th>
                                <th className="p-4 font-bold border-b border-slate-700">Descrição</th>
                                <th className="p-4 font-bold border-b border-slate-700 hidden sm:table-cell">Categoria</th>
                                <th className="p-4 font-bold border-b border-slate-700 text-right">Valor</th>
                                <th className="p-4 font-bold border-b border-slate-700 text-center w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {transactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-4 text-slate-400 font-mono text-sm whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-white">{t.title}</td>
                                    <td className="p-4 text-slate-400 hidden sm:table-cell">
                                        <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium">{t.category || 'Geral'}</span>
                                    </td>
                                    <td className={`p-4 text-right font-bold font-mono whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(t)} className="p-2 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-colors" title="Editar">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 rounded-lg transition-colors" title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {transactions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                            <Filter size={48} className="mb-4 text-slate-700" />
                            <p>Nenhuma transação encontrada.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {
                formVisible && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                            <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar Transação' : 'Nova Transação'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Descrição</label>
                                    <input required autoFocus type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none transition-colors placeholder:text-slate-700" placeholder="Ex: Salário" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Valor</label>
                                        <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none transition-colors font-mono" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Tipo</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none transition-colors appearance-none cursor-pointer">
                                            <option value="expense">Despesa</option>
                                            <option value="income">Receita</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Categoria</label>
                                    <input list="categories" type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none transition-colors placeholder:text-slate-700" placeholder="Ex: Alimentação" />
                                    <datalist id="categories">
                                        <option value="Alimentação" />
                                        <option value="Moradia" />
                                        <option value="Transporte" />
                                        <option value="Lazer" />
                                        <option value="Saúde" />
                                        <option value="Salário" />
                                        <option value="Investimentos" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Data</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none transition-colors text-slate-400" />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={cancelEdit} className="flex-1 p-4 rounded-xl hover:bg-slate-800 text-slate-400 font-bold transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                        {editingId ? 'Salvar Alterações' : 'Salvar Transação'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
