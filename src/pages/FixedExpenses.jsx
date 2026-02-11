import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CalendarClock, CreditCard, Pencil } from 'lucide-react';

export function FixedExpenses({ user }) {
    const [expenses, setExpenses] = useState([]);
    const [statusMap, setStatusMap] = useState({});
    const [formVisible, setFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', amount: '', day: '1', category: '' });

    const load = async () => {
        if (window.api) {
            const data = await window.api.getFixedExpenses(user.id);
            setExpenses(data);
            const status = await window.api.getMonthlyStatus(user.id);
            setStatusMap(status);
        }
    };

    useEffect(() => {
        load();
    }, [user.id]);

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            name: expense.name,
            amount: expense.amount,
            day: expense.day,
            category: expense.category
        });
        setFormVisible(true);
    };

    const cancelEdit = () => {
        setFormVisible(false);
        setEditingId(null);
        setFormData({ name: '', amount: '', day: '1', category: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (window.api) {
            if (editingId) {
                await window.api.updateFixedExpense(user.id, { ...formData, id: editingId });
            } else {
                await window.api.addFixedExpense(user.id, formData);
            }
            cancelEdit();
            load();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Remover despesa fixa?")) {
            if (window.api) {
                await window.api.deleteFixedExpense(user.id, id);
                load();
            }
        }
    };

    const handleRegister = async (expense) => {
        if (window.api) {
            const success = await window.api.registerFixedExpense(user.id, expense);
            if (success) {
                load(); // Refresh status
            } else {
                alert("Esta despesa já foi registrada neste mês.");
            }
        }
    };

    const handleUnregister = async (expenseId) => {
        if (window.confirm("Deseja estornar/remover o lançamento deste mês? (Isso apagará a transação criada)")) {
            if (window.api && window.api.unregisterFixedExpense) {
                await window.api.unregisterFixedExpense(user.id, expenseId);
                load();
            }
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-24 max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <CalendarClock className="text-indigo-400" size={32} /> Despesas Fixas
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Gerencie seus compromissos mensais recorrentes.</p>
                </div>
                <button onClick={() => { setEditingId(null); setFormVisible(true); }} className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> <span className="hidden sm:inline">Nova Despesa</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenses.map((expense) => {
                    const isRegistered = statusMap[expense.id];
                    return (
                        <div key={expense.id} className={`bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group transition-all hover:bg-slate-800/50 ${isRegistered ? 'opacity-75' : 'hover:border-indigo-500/30'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${isRegistered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                    <CreditCard size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700 h-fit">Dia {expense.day}</span>
                                    <button onClick={() => handleEdit(expense)} className="p-1 hover:bg-slate-700 text-slate-500 hover:text-white rounded-lg transition-colors" title="Editar">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(expense.id)} className="p-1 hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 rounded-lg transition-colors" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{expense.name}</h3>
                            <p className="text-sm text-slate-400 mb-4">{expense.category}</p>

                            <div className="flex items-center justify-between mt-6">
                                <span className="text-2xl font-bold font-mono text-white">
                                    {Number(expense.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>

                                <button
                                    onClick={() => isRegistered ? handleUnregister(expense.id) : handleRegister(expense)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${isRegistered
                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400 border border-emerald-500/20'
                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95'
                                        }`}
                                    title={isRegistered ? "Clique para estornar/remover o registro deste mês" : "Confirmar pagamento deste mês"}
                                >
                                    {isRegistered ? 'Pago (Desfazer)' : 'Confirmar Pagamento'}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {expenses.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                        <CalendarClock size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhuma despesa fixa cadastrada.</p>
                    </div>
                )}
            </div>

            {formVisible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Nome</label>
                                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500/50 outline-none transition-colors" placeholder="Ex: Aluguel" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Valor</label>
                                    <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500/50 outline-none transition-colors font-mono" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Dia do Venc.</label>
                                    <input required type="number" min="1" max="31" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500/50 outline-none transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Categoria</label>
                                <input list="categories" type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-indigo-500/50 outline-none transition-colors placeholder:text-slate-700" placeholder="Ex: Moradia" />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={cancelEdit} className="flex-1 p-4 rounded-xl hover:bg-slate-800 text-slate-400 font-bold transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    {editingId ? 'Salvar Alterações' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
