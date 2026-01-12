export interface CommandResult {
    id: string;
    intent: string;
    description: string;
    command: string;
    type: string;
    requires_admin: boolean;
    safety_tier: number;
    source: string;
}

export interface UserSettings {
    theme: string;
    gemini_api_key?: string;
    ai_provider: string;
    favorites: string[];
}

const API_URL = "http://127.0.0.1:5000";

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 10, delay = 500): Promise<Response> {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (err: any) {
        if (retries > 0 && err.message.includes("Failed to fetch")) {
            console.log(`Connection failed, retrying in ${delay}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 1.5); // Exponential backoff
        }
        throw err;
    }
}

export const api = {
    async processIntent(intent: string, apiKey?: string, provider?: string): Promise<CommandResult> {
        const res = await fetchWithRetry(`${API_URL}/process-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intent, api_key: apiKey, provider })
        });
        if (!res.ok) throw new Error("Failed to process intent");
        return res.json();
    },

    async getSettings(): Promise<UserSettings> {
        try {
            const res = await fetchWithRetry(`${API_URL}/settings`);
            if (!res.ok) return { theme: "dark", ai_provider: "ollama", favorites: [] };
            return res.json();
        } catch (e) {
            console.warn("Failed to fetch settings after retries, using defaults", e);
            return { theme: "dark", ai_provider: "ollama", favorites: [] };
        }
    },

    async updateSettings(settings: UserSettings): Promise<void> {
        await fetchWithRetry(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    },

    async summarizeOutput(intent: string, output: string, apiKey?: string, provider: string = "ollama"): Promise<{ summary: string }> {
        const res = await fetchWithRetry(`${API_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intent, output, api_key: apiKey, provider })
        });
        if (!res.ok) throw new Error("Failed to summarize output");
        return res.json();
    },

    async checkHealth(): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/health`);
            return res.ok;
        } catch {
            return false;
        }
    },

    async waitForBackend(maxAttempts = 30): Promise<boolean> {
        for (let i = 0; i < maxAttempts; i++) {
            if (await this.checkHealth()) return true;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return false;
    }
};

// Window API from Electron Preload
declare global {
    interface Window {
        api: {
            relaunchAsAdmin: () => Promise<void>;
            getAdminStatus: () => Promise<boolean>;
            executeCommand: (cmd: string) => Promise<string>;
            getBackendUrl: () => string;
        }
    }
}
