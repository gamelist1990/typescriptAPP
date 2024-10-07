const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel: string, data: any) => {
        const validChannels: string[] = ['toMain', 'save-settings'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
        const validChannels: string[] = ['fromMain', 'load-settings',];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event: any, ...args: any[]) => func(...args));
        }
    },
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('electron', {
    showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
    parseMarkdown: (markdown: any) => ipcRenderer.invoke('markdown', markdown),
    ver: () => ipcRenderer.invoke('version'),

});

// markedライブラリをレンダラープロセスで利用できるように公開
contextBridge.exposeInMainWorld('marked', {
    parse: (markdown: string, options?: any) => marked.parse(markdown, options),
});