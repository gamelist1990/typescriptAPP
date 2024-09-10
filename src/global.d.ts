// global.d.ts
/// <reference types="electron" />



declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                on(channel: string, listener: (event: any, ...args: any[]) => void): void;
                send(channel: string, ...args: any[]): void;
            };
        };
        api: {
            send: (channel: string, data: any) => void;
            receive: (channel: string, func: (...args: any[]) => void) => void;
        };
    }
}

export { };
