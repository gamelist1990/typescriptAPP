const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const https = require('https');
const ElectronNotification = require('electron').Notification; 
const { IncomingMessage } = require('http'); 
const { WriteStream } = require('fs'); 




const documentsPath = app.getPath('documents');
const appDataPath = path.join(documentsPath, 'energyAppData');
const configFilePath = path.join(appDataPath, 'config.json');


interface UpdateData {
    [version: string]: {
        url: string;
    };
}

//通知に表示する 名前 app.nameでもいい
const infoName = 'エネルギー効率アドバイザー';

const versionFilePath = path.join(__dirname,'version.json'); // version.jsonへのパス
const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));

const v = versionData.version;


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




function UpdateCheck() {
    fetch('https://gamelist1990.github.io/gamelist1990/version/data.json')
        .then(response => response.json() as Promise<UpdateData>)
        .then(updateData => {
            let latestVersion: string = v; 
            let downloadUrl: string | null = null;

            // 最新バージョンとダウンロードURLを取得
            for (const [version, value] of Object.entries(updateData)) {
                if (typeof value === 'object' && value !== null && 'url' in value) {
                    if (parseFloat(version) > parseFloat(latestVersion)) {
                        latestVersion = version;
                        downloadUrl = value.url;
                    }
                } else {
                    console.error(`バージョン ${version} の値が不正です: ${JSON.stringify(value)}`);
                }
            }

            // 最新バージョンが存在し、現在のバージョンより新しい場合
            if (parseFloat(latestVersion) > parseFloat(v) && downloadUrl !== null) {
                dialog.showMessageBox({
                    type: 'question',
                    buttons: ['はい', 'いいえ'],
                    defaultId: 0,
                    title: 'アップデート',
                    message: `新しいバージョン(${latestVersion})があります。アップデートしますか？(更新をおすすめするよ)`
                }).then(result => {
                    if (result.response === 0) {
                        const downloadPath = path.join(app.getPath('downloads'), `new_version_${latestVersion}.exe`);
                        const file = fs.createWriteStream(downloadPath);
                        https.get(downloadUrl, (response: typeof IncomingMessage) => {
                            if (response.statusCode === 302) {
                                https.get(response.headers.location!, (redirectResponse: typeof IncomingMessage) => {
                                    handleDownload(redirectResponse, file, downloadPath);
                                });
                            } else {
                                handleDownload(response, file, downloadPath);
                            }
                        }).on('error', (err: Error) => {
                            console.error('ダウンロードエラー:', err);
                            new ElectronNotification({
                                title: 'エラー',
                                body: 'ダウンロードに失敗しました。'
                            }).show();
                        });

                        new ElectronNotification({
                            title: '更新プログラム',
                            body: `新しいバージョン(${latestVersion})がダウンロードされます。`
                        }).show();
                    }
                });
            }
        })
        .catch(error => {
            console.error('JSONデータの取得に失敗しました:', error);
            new ElectronNotification({
                title: 'エラー',
                body: '更新情報の取得に失敗しました。',
            }).show();
        });


    function handleDownload(response: typeof IncomingMessage, file: typeof WriteStream, downloadPath: string) {
        if (response.statusCode !== 200) {
            console.error(`ダウンロードに失敗しました。ステータスコード: ${response.statusCode}`);
            new ElectronNotification({
                title: 'エラー',
                body: 'ダウンロードに失敗しました。'
            }).show();
            return;
        }

        const totalLength = parseInt(response.headers['content-length']!, 10);
        let downloadedLength = 0;
        let lastProgress = 0;
        const startTime = Date.now();

        response.on('data', (chunk: Buffer) => {
            downloadedLength += chunk.length;
            const progress = Math.floor(downloadedLength / totalLength * 100);

            if (progress - lastProgress >= 10) {
                lastProgress = progress;
                const elapsedTime = Date.now() - startTime;

                if (elapsedTime > 10000) {
                    new ElectronNotification({
                        title: 'ダウンロード中',
                        body: `進捗: ${progress}%`
                    }).show();
                }
            }
        });

        response.pipe(file);

        file.on('finish', () => {
            file.close();

            // ダウンロードが1秒以内に完了した場合は通知をスキップ
           
                new ElectronNotification({
                    title: 'ダウンロード完了',
                    body: 'ダウンロードが完了しました。'
                }).show();
            

            shell.openPath(downloadPath);
            app.quit();
        });

        file.on('error', (err: Error) => {
            console.error('ファイル書き込みエラー:', err);
            new ElectronNotification({
                title: 'エラー',
                body: 'ファイルの書き込みに失敗しました。'
            }).show();
        });
    }
}







function createWindow() {
    app.setAppUserModelId(infoName);
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
        width: 858,
        height: 790,
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


    ipcMain.handle('version', async () => {
        const ver = v;
        console.log('Version:', ver); // デバッグログ
        return ver;
    });

    ipcMain.handle('markdown', async (_, markdown) => {
        try {
            const html = marked.parse(markdown);
            return html;
        } catch (error) {
            console.error('Markdownの変換中にエラーが発生しました:', error);
            return ''; // エラー時のデフォルト値
        }
    });


    //ここで 更新の確認を
    UpdateCheck();
 


    

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

            version 0.5以降:"更新履歴はWEBに記述するようにしました\n
            version 0.4:"お知らせ機能/自動更新プログラム"\n
            version 0.3:"不具合修正/機能改善"\n
            version 0.2:"EXEにしてテスト"\n
            version 0.1:"BETA"
            `,
                            buttons: ["閉じる", "更新履歴へ"]
                        }).then(result => {
                            if (result.response === 1) {
                                require('electron').shell.openExternal('https://gamelist1990.github.io/gamelist1990/version/update.html');
                            }
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

