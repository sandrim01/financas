import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-slate-950 text-white h-screen flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-3xl font-bold text-rose-500 mb-4">Algo deu errado.</h1>
                    <p className="text-slate-400 mb-8">Ocorreu um erro inesperado na aplicação.</p>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left overflow-auto max-w-2xl max-h-96 w-full font-mono text-xs">
                        <p className="text-rose-400 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
