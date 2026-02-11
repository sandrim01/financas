import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, Plus, Edit2, X, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function AdminUsers({ user }) {
    const [verified, setVerified] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

    useEffect(() => {
        if (verified) {
            loadUsers();
        }
    }, [verified]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const isValid = await api.verifyAdminPassword(user.id, password);
            if (isValid) {
                setVerified(true);
            } else {
                setError('Senha incorreta ou acesso negado.');
            }
        } catch (err) {
            setError('Erro ao verificar senha.');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        const data = await api.getAdminUsers(user.id);
        setUsers(data);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Tem certeza? Isso apagará TODOS os dados deste usuário permanentemente.')) {
            await api.adminDeleteUser(userId);
            loadUsers();
        }
    };

    const openModal = (mode, userToEdit = null) => {
        setModalMode(mode);
        setCurrentUser(userToEdit);
        if (mode === 'edit' && userToEdit) {
            setFormData({ name: userToEdit.name, email: userToEdit.email, password: '', phone: userToEdit.phone || '' });
        } else {
            setFormData({ name: '', email: '', password: '', phone: '' });
        }
        setShowModal(true);
        setError(''); // Clear errors when opening modal
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let res;
            if (modalMode === 'create') {
                res = await api.adminCreateUser(formData);
            } else {
                res = await api.adminUpdateUser({
                    id: currentUser.id,
                    ...formData
                });
            }

            if (res.success) {
                setShowModal(false);
                loadUsers();
            } else {
                setError(res.message || 'Erro ao salvar.');
            }
        } catch (err) {
            setError('Erro ao processar solicitação.');
        } finally {
            setLoading(false);
        }
    };

    if (!verified) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-emerald-500/10 rounded-full">
                            <Shield size={48} className="text-emerald-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-slate-100 mb-2">Acesso Administrativo</h2>
                    <p className="text-center text-slate-400 mb-6">Confirme sua senha para gerenciar usuários.</p>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Sua senha"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="text-rose-400 shrink-0" size={18} />
                                <p className="text-rose-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Acessar Painel'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
                        <Shield className="text-emerald-400" />
                        Gerenciar Usuários
                    </h1>
                    <p className="text-slate-400">Administração total do sistema.</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </header>

            <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50">
                            <th className="p-4 text-slate-400 font-medium text-sm">Nome</th>
                            <th className="p-4 text-slate-400 font-medium text-sm">Email</th>
                            <th className="p-4 text-slate-400 font-medium text-sm">Celular</th>
                            <th className="p-4 text-slate-400 font-medium text-sm text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                <td className="p-4 text-slate-200 font-medium">{u.name}</td>
                                <td className="p-4 text-slate-400">{u.email}</td>
                                <td className="p-4 text-slate-400">{u.phone || '-'}</td>
                                <td className="p-4 flex justify-end gap-2">
                                    <button
                                        onClick={() => openModal('edit', u)}
                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {/* Prevent accidental self-delete if needed, though robust logic handles session */}
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Excluir"
                                        disabled={u.id === user.id} // Cannot delete self easily to avoid lockout 
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h3 className="text-xl font-bold text-slate-100">
                                {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Celular</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                                    placeholder="Ex: 11999998888"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {modalMode === 'create' ? 'Senha' : 'Nova Senha (opcional)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                                    required={modalMode === 'create'}
                                    placeholder={modalMode === 'edit' ? 'Deixe em branco para manter a atual' : ''}
                                />
                            </div>

                            {error && (
                                <p className="text-rose-400 text-sm mt-2">{error}</p>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
