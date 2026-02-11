import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, Lock, Mail, Fingerprint } from 'lucide-react';

export function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [stayLoggedIn, setStayLoggedIn] = useState(localStorage.getItem('remember_me') === 'true');
    const navigate = useNavigate();

    useEffect(() => {
        // Check for biometric availability
        const checkBiometry = async () => {
            if (window.PublicKeyCredential) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (available) {
                    setBiometryAvailable(true);
                    return;
                }
            }
            // If on Android, our api helper will return availability
            try {
                // If we are on Android, we can assume it might be available
                if (navigator.userAgent.toLowerCase().includes('android')) {
                    setBiometryAvailable(true);
                }
            } catch (e) { }
        };
        checkBiometry();
    }, []);

    const handleBiometric = async () => {
        const lastEmail = localStorage.getItem('last_user_email');
        if (!lastEmail) {
            setError('Faça login com senha primeiro para habilitar a biometria.');
            return;
        }

        try {
            setLoading(true);
            const result = await api.loginBiometric(lastEmail);
            if (result.success) {
                if (stayLoggedIn) {
                    localStorage.setItem('user_session', JSON.stringify(result.user));
                }
                onLogin(result.user);
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error(err);
            setError('Falha na autenticação biométrica.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await api.loginUser({ email, password });
            if (result.success) {
                localStorage.setItem('last_user_email', email);
                localStorage.setItem('remember_me', stayLoggedIn);

                if (stayLoggedIn) {
                    localStorage.setItem('user_session', JSON.stringify(result.user));
                } else {
                    localStorage.removeItem('user_session');
                }

                onLogin(result.user);
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Erro ao conectar com o serviço.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                        <LogIn size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
                    <p className="text-slate-400 mt-2">Acesse suas finanças pessoais</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-colors"
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500/50 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 ml-1">
                        <input
                            id="remember"
                            type="checkbox"
                            checked={stayLoggedIn}
                            onChange={e => setStayLoggedIn(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/50 outline-none cursor-pointer"
                        />
                        <label htmlFor="remember" className="text-slate-400 text-sm cursor-pointer select-none">Manter conectado</label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>

                    {biometryAvailable && (
                        <button
                            type="button"
                            onClick={handleBiometric}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Fingerprint size={20} />
                            Entrar com Biometria
                        </button>
                    )}
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        Ainda não tem conta?{' '}
                        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                            Crie agora
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
