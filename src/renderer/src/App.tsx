import { useState, useEffect } from 'react';
import { TerminalInput } from './components/TerminalInput';
import { CommandCard } from './components/CommandCard';
import { SettingsPanel } from './components/SettingsPanel';
import { api } from './api/client';
import type { CommandResult } from './api/client';
import { Cpu, Settings } from 'lucide-react';

import logo from './assets/Winregi.svg';

export default function App() {
    const [result, setResult] = useState<CommandResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isBackendReady, setIsBackendReady] = useState(false);
    const [executionOutput, setExecutionOutput] = useState<string | null>(null);
    const [executionSummary, setExecutionSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    useEffect(() => {
        // Initial Startup Checks
        const init = async () => {
             // 1. Check Admin Status (Fast, IPC)
            if (window.api && window.api.getAdminStatus) {
                window.api.getAdminStatus().then(setIsAdmin);
            }

            // 2. Wait for Backend (Slow, Network)
            const ready = await api.waitForBackend();
            setIsBackendReady(ready);
            if (!ready) {
                setError("Backend failed to start. Please restart the app.");
            }
        };
        init();
    }, []);

    const handleSearch = async (query: string) => {
        setLoading(true);
        setError(null);
        setResult(null);
        setExecutionOutput(null);
        setExecutionSummary(null);
        try {
            // Get settings for provider preference
            const settings = await api.getSettings();
            const res = await api.processIntent(query, settings.gemini_api_key, settings.ai_provider);
            setResult(res);
        } catch (err) {
            setError("Failed to process request. Ensure backend is running.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (cmd: string) => {
        setError(null);
        setExecutionOutput(null);
        setExecutionSummary(null);
        
        try {
            let output = "";
            if (window.api && window.api.executeCommand) {
                output = await window.api.executeCommand(cmd);
            } else {
                console.warn("Execution API not available");
                output = "Simulated Output: Success";
            }
            setExecutionOutput(output);
            
            // Auto Summarize
            setIsSummarizing(true);
            try {
                const settings = await api.getSettings();
                const summaryRes = await api.summarizeOutput(
                    result?.intent || "User Action", 
                    output, 
                    settings.gemini_api_key, 
                    settings.ai_provider
                );
                setExecutionSummary(summaryRes.summary);
            } catch (summaryErr) {
                 console.warn("Summary failed", summaryErr);
            } finally {
                setIsSummarizing(false);
            }

        } catch (e: any) {
            console.error("Execution error:", e);
            setError(`Execution failed: ${e.message || e}`);
        }
    };

    if (!isBackendReady) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="font-mono text-sm tracking-widest uppercase">System Initializing...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8 flex flex-col font-sans selection:bg-emerald-500/30">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <Cpu className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <img src={logo} alt="WinRegi" className="h-10 w-auto mb-1" />
                        <div className="flex items-center gap-2">
                             <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Control Center v1.0</p>
                             <button 
                                onClick={() => (window.api as any)?.openExternal('https://winregi.dev')}
                                className="text-[10px] bg-slate-800 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 hover:border-emerald-500/30 transition-all uppercase tracking-widest font-mono"
                            >
                                winregi.dev
                            </button>
                             {isAdmin && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-mono uppercase">
                                    Admin
                                </span>
                             )}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
                <div className="mb-8">
                    <TerminalInput onSearch={handleSearch} isLoading={loading} />
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CommandCard result={result} onExecute={(cmd) => handleExecute(cmd)} />
                        
                        {/* Execution Output & Summary */}
                        {(executionOutput || isSummarizing) && (
                            <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">System Output</h3>
                                <pre className="font-mono text-sm text-slate-300 overflow-x-auto overflow-y-auto whitespace-pre-wrap max-h-40 mb-4 p-2 bg-slate-900 rounded border border-slate-800">
                                    {executionOutput}
                                </pre>

                                {isSummarizing ? (
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
                                         <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                         Analyzing result...
                                    </div>
                                ) : executionSummary && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            AI Summary
                                        </h3>
                                        <div className="text-sm text-emerald-100/90 leading-relaxed whitespace-pre-wrap font-sans">
                                            {executionSummary}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {!result && !loading && !error && (
                    <div className="text-center mt-12 opacity-30">
                        <p className="text-sm">Ready for input...</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-auto pt-8 border-t border-slate-800/50 text-center text-xs text-slate-600">
                <p>
                    System Status: Online • Hybrid AI Engine Active •{' '}
                    <button 
                        onClick={() => (window.api as any)?.openExternal('https://winregi.dev')}
                        className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                        winregi.dev
                    </button>
                </p>
            </footer>

            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
