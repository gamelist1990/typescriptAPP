// global.d.ts
/// <reference types="electron" />


declare global {
    interface Window {
        showMessageBox(options: any): Promise<any>;
        electron: {
            [x: string]:
            /// <reference types="electron" />
            any;
            ipcRenderer: {
                on(channel: string, listener: (event: any, ...args: any[]) => void): void;
                send(channel: string, ...args: any[]): void;
            };
        };
        api: {
            [x: string]:
            /// <reference types="electron" />
            any;
            send: (channel: string, data: any) => void;
            receive: (channel: string, func: (...args: any[]) => void) => void;
        };
    }
}

export { };
