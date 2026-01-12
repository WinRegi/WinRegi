import { useState } from 'react';
import type { CommandResult } from '../api/client';
import { ShieldCheck, Sparkles, Star, Copy, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for safe joining of classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CommandCardProps {
    result: CommandResult;
    onExecute: (cmd: string, admin: boolean) => void;
}

export function CommandCard({ result, onExecute }: CommandCardProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "border rounded-lg p-4 mb-4 bg-slate-850 transition-all",
            result.safety_tier === 1 ? "border-emerald-500/50" : 
            result.safety_tier === 2 ? "border-yellow-500/50" : "border-blue-500/50"
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {result.safety_tier === 1 && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    {result.safety_tier === 2 && <Sparkles className="w-5 h-5 text-yellow-400" />}
                    {result.safety_tier === 3 && <Star className="w-5 h-5 text-blue-400 fill-blue-400" />}
                    
                    <span className={cn(
                        "text-sm font-semibold uppercase tracking-wider",
                        result.safety_tier === 1 ? "text-emerald-400" :
                        result.safety_tier === 2 ? "text-yellow-400" : "text-blue-400"
                    )}>
                        {result.source}
                    </span>
                </div>
                {result.requires_admin && (
                     <span className="text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-500/30">
                        ADMIN REQUIRED
                     </span>
                )}
            </div>
            
            <p className="text-slate-300 text-sm mb-4">{result.description}</p>
            
            <div className="bg-slate-950 p-3 rounded font-mono text-xs text-slate-200 overflow-x-auto mb-4 border border-slate-700/50">
                {result.command}
            </div>

            <div className="flex gap-2 justify-end">
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
                >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied" : "Copy"}
                </button>
                <button 
                    onClick={() => onExecute(result.command, result.requires_admin)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded text-slate-900 font-medium text-sm transition-colors",
                         result.safety_tier === 2 ? "bg-yellow-400 hover:bg-yellow-500" : "bg-emerald-400 hover:bg-emerald-500"
                    )}
                >
                    <Play className="w-4 h-4" />
                    Execute
                </button>
            </div>
        </div>
    );
}
