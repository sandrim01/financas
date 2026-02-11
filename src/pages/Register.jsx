import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Loader2, Phone } from 'lucide-react';

export function Register({ onLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (window.api) {
            try {
                const result = await window.api.register({ name, email, phone, password });
                if (result.success) {
                    localStorage.setItem('last_user_email', email); // Save for biometric
                    onLogin(result.user);
                    navigate('/'); // Auto login
                } else {
                    setError(result.message);
                }
            } catch (err) {
                setError('Erro ao registrar.');
            }
        } else {
            // Mock
            setError('Instale o aplicativo Electron.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                        <span className="font-bold text-slate-900 text-3xl">F</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Crie sua Conta</h1>
                    <p className="text-slate-400 mt-2">Comece a controlar suas finanças hoje</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Nome</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500/50 outline-none transition-colors"
                                placeholder="Seu nome"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500/50 outline-none transition-colors"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500/50 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-indigo-500/50 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Criando Conta...' : 'Registrar'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                            Faça Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
