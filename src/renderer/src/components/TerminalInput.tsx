import { useState, type KeyboardEvent } from 'react';
import { ArrowRight, Terminal } from 'lucide-react';

interface TerminalInputProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export function TerminalInput({ onSearch, isLoading }: TerminalInputProps) {
    const [query, setQuery] = useState("");

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (query.trim()) {
                onSearch(query);
            }
        }
    };

    return (
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Terminal className="w-5 h-5 text-slate-500" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your intent (e.g., 'Enable Dark Mode')"
                disabled={isLoading}
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 pl-12 pr-12 py-4 rounded-xl text-lg focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono shadow-lg shadow-black/20"
                autoFocus
            />
            <button
                onClick={() => query.trim() && onSearch(query)}
                disabled={isLoading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <ArrowRight className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
