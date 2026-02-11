import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

export function FinancialFeed() {
    const [quotes, setQuotes] = useState({
        usd: { bid: 0, pctChange: 0 },
    });
    const [rates, setRates] = useState({
        selic: 0,
        cdi: 0,
        ipca: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Cotação Dólar (AwesomeAPI)
            const quoteRes = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
            const quoteData = await quoteRes.json();

            // Taxas Oficiais (BrasilAPI)
            const selicRes = await fetch('https://brasilapi.com.br/api/taxas/v1/selic');
            const selicData = await selicRes.json();

            const cdiRes = await fetch('https://brasilapi.com.br/api/taxas/v1/cdi');
            const cdiData = await cdiRes.json();

            const ipcaRes = await fetch('https://brasilapi.com.br/api/taxas/v1/ipca');
            const ipcaData = await ipcaRes.json();

            setQuotes({
                usd: quoteData.USDBRL
            });

            setRates({
                selic: selicData.valor || 0,
                cdi: cdiData.valor || 0,
                ipca: ipcaData.valor || 0
            });

        } catch (error) {
            console.error("Erro ao buscar dados financeiros:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000 * 5); // Atualiza a cada 5 min
        return () => clearInterval(interval);
    }, []);

    // Estimativas de Rendimentos Bancários (Baseados no CDI)
    // Poupança: 0.5% + TR (aprox 0.6% mes ou 7.4% ano - simplificado)
    // Nubank / Bancos Digitais (100% CDI): ~CDI
    // CDB Grandes Bancos (80-90% CDI)
    const cdiAnual = Number(rates.cdi);
    const poupancaEstimada = 6.17 + Math.max(0, cdiAnual * 0.2); // Regra simplificada da poupança (estimativa)

    const bankYields = [
        { name: 'Poupança (Estimada)', value: poupancaEstimada, color: 'text-yellow-400' },
        { name: 'Nubank / Digitais (100% CDI)', value: cdiAnual, color: 'text-purple-400' },
        { name: 'CDB Grandes Bancos (85% CDI)', value: cdiAnual * 0.85, color: 'text-blue-400' },
    ];

    if (loading) {
        return (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl animate-pulse h-full flex items-center justify-center">
                <RefreshCcw className="animate-spin text-slate-600" size={32} />
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700/50 transition-all h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={20} />
                    Mercado Financeiro
                </h3>
                <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded-md">Ao Vivo</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Dólar */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={12} /> Dólar (USD)
                    </p>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-slate-100">
                            R$ {Number(quotes.usd.bid).toFixed(2)}
                        </p>
                        <span className={`text-xs font-bold mb-1 ${Number(quotes.usd.pctChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Number(quotes.usd.pctChange) >= 0 ? '+' : ''}{Number(quotes.usd.pctChange).toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* Selic/CDI */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
                    <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                        <Percent size={12} /> Taxa Selic
                    </p>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold text-slate-100">
                            {rates.selic}%
                        </p>
                        <span className="text-xs text-slate-500 mb-1 font-bold">a.a.</span>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Rendimentos Anuais (Estimativa)</h4>
                <div className="space-y-3">
                    {bankYields.map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/60 transition-colors">
                            <span className="text-slate-300 font-medium">{b.name}</span>
                            <span className={`font-mono font-bold ${b.color}`}>
                                {b.value.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-[10px] text-slate-600 mt-4 text-center">
                * Valores baseados nas taxas oficiais (BrasilAPI). Variações reais podem ocorrer por banco.
            </p>
        </div>
    );
}
