const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const documentsPath = app.getPath('documents');
const appDataPath = path.join(documentsPath, 'energyAppData');
const configFilePath = path.join(appDataPath, 'config.json');

if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath);
}

function loadSettings() {
    try {
        const configData = fs.readFileSync(configFilePath, 'utf-8');
        return JSON.parse(configData);
    } catch (error) {
        const defaultSettings = {
            settingsData: {
                provider: "Koala",
                token: ""
            }
        };
        saveSettings(defaultSettings);
        return defaultSettings;
    }
}

function saveSettings(settings: { settingsData: { provider: string; token: string; }; }) {
    const configData = JSON.stringify(settings);
    fs.writeFileSync(configFilePath, configData, 'utf-8');
}

function createWindow() {
    const loadWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    loadWindow.loadFile(path.join(__dirname, 'loading.html'));

    const mainWindow = new BrowserWindow({
        width: 910,
        height: 700,
        icon: path.join(__dirname, 'assets', 'app.ico'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'エネルギー効率改善アドバイザー',
    });
    //開発者コンソールいるなら以下のコメントを消す 関数は openDevTools
    //mainWindow.webContents.openDevTools();

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.once('ready-to-show', () => {
        loadWindow.close();
        mainWindow.show();
        mainWindow.webContents.send('load-settings', loadSettings());
    });

    ipcMain.handle('show-message-box', async (_, options) => {
        const result = await dialog.showMessageBox(mainWindow, options);
        return result;
    });

    const v = "0.3"

    const menu = Menu.buildFromTemplate([
        {
            label: 'メニュー',
            submenu: [
                {
                    label: '終了',
                    click: () => {
                        app.quit();
                    },
                },
                {
                    label: '開発者コンソール(別ウィンドウ)',
                    click: () => {
                        const dev = new BrowserWindow({
                            width:800,
                            height:600,
                        })
                        mainWindow.webContents.setDevToolsWebContents(dev.webContents);
                        mainWindow.webContents.openDevTools({mode:'detach'})
                    },
                }
            ],
        },
        {
            label: 'ヘルプ',
            submenu: [
                {
                    label: "更新履歴",
                    click: () => {
                        dialog.showMessageBox({
                            type: "info",
                            title: "<更新履歴>",
                            message: `
                            現バージョンは${v}です

                            version 0.3:"不具合修正/機能改善"\n
                            version 0.2:"EXEにしてテスト"\n
                            version 0.1:"BETA"
                            `,
                            buttons: ["閉じる"]
                        });
                    }
                },
                {
                    label: '概要',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: '概要だよ',
                            message: `
                            エネルギー効率改善アドバイザー\n
                            AIに質問したり分析機能で手軽に発電率を計算することができます！\n
                            Create By Gamelist1990\n
                            バージョン: ${v}`,
                            buttons: ['閉じる']
                        });
                    }
                },
            ],
        },
    ]);

    Menu.setApplicationMenu(menu);

    ipcMain.on('save-settings', (_event, settings) => {
        saveSettings(settings);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

