function showTokenMessage(message: string): void {
    const options = {
        type: 'info',
        buttons: ['クリックして続行'],
        title: 'Token発行完了',
        message: message,
        nolink: true,
    };

    window.electron.showMessageBox(options).then((result: any) => {
        console.log(result);
    });
}

function showINFO(title: string, message: string): void {
    const options = {
        type: 'info',
        buttons: ['ok'],
        title: title,
        message: message,
        nolink: true,
    };

    window.electron.showMessageBox(options).then((result: any) => {
        console.log(result);
    });
}

function showError(error: string): void {
    const options = {
        type: 'error',
        buttons: [''],
        title: 'Errorが発生しました',
        message: '以下のエラーが発生しました',
        detail: error,
        nolink: true,
    };

    window.electron.showMessageBox(options).then((result: any) => {
        console.log(result);
    });
}



export { showTokenMessage, showError, showINFO }

console.log("API has been Loaded..");
