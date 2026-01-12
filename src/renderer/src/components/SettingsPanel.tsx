import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { UserSettings } from '../api/client';
import { Settings, RefreshCw, LogOut, Cpu, Shield, Info, ArrowLeft, ExternalLink } from 'lucide-react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const [activeTab, setActiveTab] = useState<'ai' | 'system' | 'about'>('ai');
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'dark',
        ai_provider: 'ollama',
        favorites: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.getSettings().then(setSettings);
        }
    }, [isOpen]);

    const handleSave = async () => {
        setLoading(true);
        await api.updateSettings(settings);
        setLoading(false);
    };

    const handleRelaunchAdmin = async () => {
        if (window.api && window.api.relaunchAsAdmin) {
            await window.api.relaunchAsAdmin();
        } else {
            alert("This feature is only available in the desktop app.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex text-slate-200 font-sans animate-in fade-in duration-200">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 bg-slate-900/50 p-6 flex flex-col">
                <div className="mb-10 flex items-center gap-3 text-emerald-400">
                    <Settings className="w-6 h-6" />
                    <h2 className="text-lg font-bold tracking-tight text-white">Configuration</h2>
                </div>

                <nav className="space-y-1 flex-1">
                    <SidebarItem 
                        icon={Cpu} 
                        label="AI Engine" 
                        active={activeTab === 'ai'} 
                        onClick={() => setActiveTab('ai')} 
                    />
                    <SidebarItem 
                        icon={Shield} 
                        label="System" 
                        active={activeTab === 'system'} 
                        onClick={() => setActiveTab('system')} 
                    />
                    <SidebarItem 
                        icon={Info} 
                        label="About" 
                        active={activeTab === 'about'} 
                        onClick={() => setActiveTab('about')} 
                    />
                </nav>

                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mt-auto py-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Terminal</span>
                </button>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-950/50">
                <div className="max-w-3xl mx-auto p-12">
                    {activeTab === 'ai' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">AI Engine</h3>
                                <p className="text-slate-400">Configure the intelligence backend for command processing.</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Provider Preference</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ProviderCard 
                                            active={settings.ai_provider === 'ollama'}
                                            onClick={() => setSettings({...settings, ai_provider: 'ollama'})}
                                            title="Local (Ollama)"
                                            desc="Private, offline, runs on your hardware."
                                        />
                                        <ProviderCard 
                                            active={settings.ai_provider === 'gemini'}
                                            onClick={() => setSettings({...settings, ai_provider: 'gemini'})}
                                            title="Cloud (Gemini)"
                                            desc="Faster, higher accuracy, requires API key."
                                        />
                                    </div>
                                </div>

                                {settings.ai_provider === 'gemini' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                                        <input 
                                            type="password" 
                                            value={settings.gemini_api_key || ''}
                                            onChange={(e) => setSettings({...settings, gemini_api_key: e.target.value})}
                                            placeholder="Enter your AIzaSy... key"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600 font-mono text-sm"
                                        />
                                        <p className="mt-2 text-xs text-slate-500">Your key is stored locally and never shared with us.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Configuration"}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                             <div>
                                <h3 className="text-2xl font-bold text-white mb-2">System</h3>
                                <p className="text-slate-400">Manage application privileges and appearance.</p>
                            </div>

                             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Privilege Escalation</h4>
                                <div className="flex items-center justify-between">
                                    <div className="max-w-md">
                                        <p className="text-slate-300 font-medium">Administrator Access</p>
                                        <p className="text-sm text-slate-500 mt-1">Required for modifying Registry keys (HKLM) and managing Windows Services.</p>
                                    </div>
                                    <button 
                                        onClick={handleRelaunchAdmin}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Restart as Admin
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                             <div>
                                <h3 className="text-2xl font-bold text-white mb-2">About WinRegi</h3>
                                <p className="text-slate-400">Version 1.0.0 • Production Build</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                                <p className="text-slate-300 leading-relaxed">
                                    WinRegi is a next-generation control center for Windows power users. 
                                    It combines natural language processing with low-level system access to simplify complex configuration tasks.
                                </p>
                                
                                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                                     <button 
                                        onClick={() => (window.api as any)?.openExternal('https://winregi.dev')}
                                        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors w-fit"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Website (winregi.dev)
                                    </button>
                                    <button 
                                        onClick={() => (window.api as any)?.openExternal('https://github.com/Winregi/WinRegi')}
                                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Source Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function ProviderCard({ active, onClick, title, desc }: { active: boolean, onClick: () => void, title: string, desc: string }) {
    return (
        <button 
            onClick={onClick}
            className={`text-left p-4 rounded-lg border transition-all ${
                active 
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${active ? 'text-emerald-400' : 'text-slate-200'}`}>{title}</span>
                {active && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
        </button>
    );
}
