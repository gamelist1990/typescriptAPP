function ShowTokenMessage(message) {
    const options = {
        type: 'info',
        buttons: ['クリックして続行'],
        title: 'Token発行完了',
        message: message,
        nolink:true,
    };

    window.electron.showMessageBox(options).then(result => {
        console.log(result);
    });
}

function ShowINFO(title,message) {
    const options = {
        type: 'info',
        buttons: ['ok'],
        title: title,
        message: message,
        nolink:true,
    };

    window.electron.showMessageBox(options).then(result => {
        console.log(result);
    });
}

function ShowError(error) {
    const options = {
        type: 'error',
        buttons: [''],
        title: 'Errorが発生しました',
        message: '以下のエラーが発生しました',
        detail: error,
        nolink:true,
    };

    window.electron.showMessageBox(options).then(result => {
        console.log(result);
    });
}

console.log("API has been Loaded..");
