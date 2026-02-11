import React, { useState } from 'react';
import { Lock, Fingerprint, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export function LockScreen({ user, onUnlock }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [password, setPassword] = useState('');

    const handlePasswordUnlock = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            const result = await api.loginUser({
                email: user.email,
                password
            });

            if (result.success) {
                onUnlock();
            } else {
                setError('Senha incorreta.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricUnlock = async () => {
        try {
            setLoading(true);
            setError('');

            // Check if biometric is available
            if (!window.PublicKeyCredential) {
                setError('Biometria não disponível. Use a senha.');
                setShowPasswordInput(true);
                return;
            }

            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                setError('Windows Hello não configurado. Use a senha.');
                setShowPasswordInput(true);
                return;
            }

            // Try to authenticate with Windows Hello
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            try {
                await navigator.credentials.get({
                    publicKey: {
                        challenge,
                        timeout: 60000,
                        userVerification: 'required',
                        allowCredentials: [],
                    }
                });

                onUnlock();
            } catch (credError) {
                console.log('Biometric auth failed:', credError);
                setError('Biometria não disponível. Use a senha.');
                setShowPasswordInput(true);
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao autenticar. Use a senha.');
            setShowPasswordInput(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative">
                <div className="text-center mb-8">
                    <div className="bg-amber-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">App Bloqueado</h1>
                    <p className="text-slate-400 mt-2">Olá, {user?.name?.split(' ')[0]}</p>
                    <p className="text-slate-500 text-sm mt-1">Confirme sua identidade para continuar</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {!showPasswordInput ? (
                    <div className="space-y-3">
                        <button
                            onClick={handleBiometricUnlock}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Fingerprint size={24} />
                            {loading ? 'Autenticando...' : 'Desbloquear com Biometria'}
                        </button>

                        <button
                            onClick={() => setShowPasswordInput(true)}
                            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <KeyRound size={20} />
                            Usar Senha
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordUnlock} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none transition-colors"
                                placeholder="Digite sua senha"
                                autoFocus
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Desbloqueando...' : 'Desbloquear'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowPasswordInput(false);
                                setPassword('');
                                setError('');
                            }}
                            className="w-full py-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
                        >
                            Voltar
                        </button>
                    </form>
                )}

                <p className="text-center text-slate-500 text-xs mt-6">
                    {!showPasswordInput ? 'Use Windows Hello ou senha para desbloquear' : 'Digite sua senha de login'}
                </p>
            </div>
        </div>
    );
}
