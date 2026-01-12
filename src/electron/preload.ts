import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    relaunchAsAdmin: () => ipcRenderer.invoke('relaunch-as-admin'),
    getAdminStatus: () => ipcRenderer.invoke('get-admin-status'),
    executeCommand: (cmd: string) => ipcRenderer.invoke('execute-command', cmd),
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    // We can also expose backend URL if needed, but renderer can just hit localhost:5000
    // or we can proxy.
    getBackendUrl: () => 'http://localhost:5000',
});
