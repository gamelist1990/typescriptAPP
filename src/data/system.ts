import { showError, showINFO, showTokenMessage } from "../renderer.js";


interface SettingsData {
    provider: string;
    token: string;
}

interface ConfigData {
    settingsData: SettingsData;
}


let version: string | number = 0;

window.electron.ver().then((ver: string) => {
    version = ver; 
});


document.addEventListener('DOMContentLoaded', () => {
    let ConfigData: ConfigData = { settingsData: { provider: '', token: '' } };

    console.log("Start System.ts")
    



    //Start system Program
    setTimeout(()=>{
        getInfoData();
        console.log(`System Version ${version}`);
    },3000)


    //InnerHtml
    inputHtml();
    fetchAndDisplayHTML("https://gamelist1990.github.io/gamelist1990/version/update.html","UpdateSection")
    

    // メインプロセスから設定を受け取る
    window.api.receive('load-settings', (data: ConfigData) => {
        ConfigData = data;
        console.log(JSON.stringify(data));
        (document.getElementById('aiProvider') as HTMLSelectElement).value = ConfigData.settingsData.provider;
        (document.getElementById('api') as HTMLInputElement).value = ConfigData.settingsData.token;
    });


    function inputHtml() {
        const VersionP = document.getElementById("version");
        setTimeout(()=>{
            if (VersionP != null && version !== null)
                VersionP.innerHTML = `現在のバージョンは${version}α版です`;
        },2000)
    }

    async function fetchAndDisplayHTML(url: string | URL | Request, elementId: string) {
        try {
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const html = await response.text();
            const element = document.getElementById(elementId);
            if (element !== null){
                element.innerHTML = html;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            const element = document.getElementById(elementId);
            if (element !== null) {
                element.innerHTML = `<h1>Error</h1><br><p>URLからの情報の取得に失敗しました以下の要因があるか確認してください。<oi><li>WIFIへの接続をしていない</li><li>WEBserver側の問題</li>これらの要因が当てはまる場合は取得できません</p><br><h3>Error内容</h3><p>${error}</p>`;
            }
            
            
        }
    }
        

    function getInfoData() {
        fetch('https://gamelist1990.github.io/gamelist1990/version/info.json')
            .then(response => response.json())
            .then(infoData => {
                let message = '';

                // バージョン番号に対応するお知らせがあるか確認
                if (infoData[version]) {
                    message = infoData[version];
                } else if (infoData.info) {
                    message = infoData.info;
                }
                if (message.trim() !== "") {
                    showINFO('お知らせ', message);
                }
            })
            .catch(error => {
                console.error('JSONデータの取得に失敗しました:', error);
                showINFO('お知らせ', `お知らせの情報を取得中にエラーが発生しました:ERROR :${error}`);
            });
    }

    // Token発行ボタンのイベントリスナー
    const showDialogButton = document.getElementById('showDialogButton') as HTMLButtonElement;
    const webapi = document.getElementById('api') as HTMLInputElement;

    showDialogButton.addEventListener('click', async () => {
        try {
            const response = await fetch('https://webapi-8trs.onrender.com/create_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            const accessToken = data.access_token;

            showTokenMessage(`受け取ったキー: ${accessToken}\n\nコピーして続行してください。`);

            navigator.clipboard.writeText(accessToken)
                .then(() => {
                    console.log('Tokenをクリップボードにコピーしました');
                })
                .catch(err => {
                    console.error('クリップボードへのコピーに失敗しました: ', err);
                });

        } catch (error) {
            console.error('Token発行中にエラーが発生しました:', error);
            showError(`${error}`);
        }
    });

    // サイドバーの表示/非表示
    const hamburger = document.getElementById('hamburger') as HTMLDivElement;
    const sidebar = document.getElementById('sidebar') as HTMLDivElement;

    sidebar.classList.remove('open');

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        hamburger.classList.toggle('open');
    });

    // サイドバーの項目とコンテンツエリアの関連付け
    const menuItems = document.querySelectorAll('.sidebar-item') as NodeListOf<HTMLDivElement>;
    const contentSections = document.querySelectorAll('.content-section') as NodeListOf<HTMLDivElement>;

    function hideAllSections() {
        contentSections.forEach(section => {
            section.style.display = 'none';
        });
    }

    function showSection(sectionId: string) {
        hideAllSections();
        const section = document.getElementById(sectionId) as HTMLDivElement;
        section.style.display = 'block';
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target') as string;
            showSection(targetId);

            sidebar.classList.remove('open');
            hamburger.classList.remove('open');
        });
    });

    showSection('homeSection');

    // 分析のフォーム処理
    const panelCountInput = document.getElementById('panelCount') as HTMLInputElement;
    const sunshineTimeInput = document.getElementById('sunshineTime') as HTMLInputElement;
    const analyzeButton = document.getElementById('analyzeButton') as HTMLButtonElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;

    analyzeButton.addEventListener('click', () => {
        const panelCount = parseInt(panelCountInput.value);
        const sunshineTime = parseInt(sunshineTimeInput.value);
        const powerPerPanel = 0.2;
        const solarPower = panelCount * sunshineTime * powerPerPanel;

        if (panelCount < 1 || panelCount > 30) {
            resultDiv.innerHTML = 'パネルの数は1から30の間で入力してください。';
            return;
        }

        if (sunshineTime < 1 || sunshineTime > 24) {
            resultDiv.innerHTML = '時間は24時間までの範囲で入力してね';
            return;
        }

        let adviceText = '';

        if (solarPower < 1) {
            adviceText = `現在の発電量は<b>1kWh以下</b>と非常に少ないです。<br>
                  発電量を増やすための具体的な提案は以下の通りです。<br>
                  <ul>
                    <li>パネルの数を増やす</li>
                    <li>日当たりの良い場所に設置する</li>
                    <li>パネルの角度を調整する</li>
                    <li>定期的にパネルの清掃を行い、効率を維持する</li>
                    <li>高効率のパネルに交換する</li>
                  </ul>
                  これらの対策を講じることで、発電量を増やすことが期待できます。`;
        } else if (solarPower < 3) {
            adviceText = `現在の発電量は<b>3kWh以下</b>です。<br>
                  発電効率を上げるための提案は以下の通りです。<br>
                  <ul>
                    <li>パネルの角度を少し調整する</li>
                    <li>日陰になる部分を減らす、反射光を利用するなど、設置場所を見直す</li>
                    <li>パネルの清掃を定期的に行う</li>
                    <li>エネルギー管理システムを導入し、効率的なエネルギー使用を図る</li>
                  </ul>
                  これらの対策を講じることで、発電効率をさらに向上させることができます。`;
        } else if (solarPower < 5) {
            adviceText = `現在の発電量は<b>5kWh以下</b>です。<br>
                  発電効率を上げるための提案は以下の通りです。<br>
                  <ul>
                    <li>パネルの角度を少し調整する</li>
                    <li>日陰になる部分を減らす、反射光を利用するなど、設置場所を見直す</li>
                    <li>パネルの清掃を定期的に行う</li>
                    <li>エネルギー管理システムを導入し、効率的なエネルギー使用を図る</li>
                  </ul>
                  これらの対策を講じることで、発電効率をさらに向上させることができます(5kwhあれば十分使えます)。`;
        } else {
            adviceText = `素晴らしい！あなたの太陽光発電システムは1日あたり約<b>${solarPower}kWh</b>の電力を生成し、非常に効率的に動作しています。<br>
                  さらに効率を上げるための提案は以下の通りです。<br>
                  <ul>
                    <li>エネルギー管理システムを導入し、効率的なエネルギー使用を図る</li>
                    <li>蓄電システムを導入し、余剰電力を有効活用する</li>
                    <li>定期的なメンテナンスを行い、システムの最適な状態を維持する</li>
                  </ul>
                  これらの対策を講じることで、さらに効率的な発電が期待できます。`;
        }

        resultDiv.innerHTML = adviceText;
    });


    // 保存ボタンのイベントリスナー
    const saveSettingsButton = document.getElementById('saveSettings') as HTMLButtonElement;
    saveSettingsButton.addEventListener('click', async () => {
        const aiProvider = document.getElementById('aiProvider') as HTMLSelectElement;
        ConfigData.settingsData.provider = aiProvider.value;
        ConfigData.settingsData.token = webapi.value;
        console.log(webapi);
        window.api.send('save-settings', ConfigData);
        console.log('設定を保存しました', ConfigData);
        showINFO('設定保存完了', "設定が正常に保存されました");
    });

    // AIを使用して計算のフォーム処理
    const aiAnalyzeForm = document.getElementById('aiAnalysisForm') as HTMLFormElement;
    const aiResult = document.getElementById('aiResult') as HTMLDivElement;
    const aiAnalyzeButton = document.getElementById('aiAnalyzeButton') as HTMLButtonElement;


    if (aiAnalyzeForm && aiResult && aiAnalyzeButton) {
        aiAnalyzeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            aiAnalyzeButton.disabled = true;
            aiAnalyzeButton.textContent = "ただいま回答を処理中です...";

            const aiPanelCount = (document.getElementById('aiPanelCount') as HTMLInputElement).value;
            const aiSunshineTime = (document.getElementById('aiSunshineTime') as HTMLInputElement).value;
            const aiInstallationTime = (document.getElementById('aiInstallationTime') as HTMLInputElement).value;
            const aiGeneration = (document.getElementById('aiGeneration') as HTMLInputElement).value;
            const aiLocation = (document.getElementById('aiLocation') as HTMLInputElement).value;
            const aiAngle = (document.getElementById('aiAngle') as HTMLInputElement).value;
            const aiSystemCapacity = (document.getElementById('aiSystemCapacity') as HTMLInputElement).value;
            const aiPurpose = (document.getElementById('aiPurpose') as HTMLInputElement).value;



            const question = `太陽光発電のデータが次のような場合、どのようなアドバイスがありますか？ パネル数: ${aiPanelCount}, 日照時間: ${aiSunshineTime}時間, 1日の総発電量(kWh): ${aiGeneration}, どこに住んでいるか: ${aiLocation}, ソーラーパネルの設置角度: ${aiAngle}°, 設置した年: ${aiInstallationTime}, 太陽光発電システム全体の容量(kW): ${aiSystemCapacity}, アドバイスを求める目的: ${aiPurpose}`;

            try {
                const response = await fetch('https://webapi-8trs.onrender.com/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: question,
                        provider: ConfigData.settingsData.provider,
                        token: ConfigData.settingsData.token
                    })
                });

                const data = await response.json();
                if (data.response) {
                    const html = await window.electron.parseMarkdown(data.response);
                    aiResult.innerHTML = `${html}`;
                } else {
                    aiResult.innerHTML = "AIからの回答がありませんでした。";
                }
            } catch (error) {
                console.error('AIへの質問中にエラーが発生しました:', error);
                aiResult.innerHTML = 'エラーが発生しました。';
                aiAnalyzeForm.reset();
            } finally {
                aiAnalyzeButton.disabled = false;
                aiAnalyzeButton.textContent = "AIに質問";
            }
        });
    } else {
        console.error("aiAnalysisForm または aiResult element が見つかりません");
    }

    // スライダーの値を表示する処理
    const aiPanelCountSlider = document.getElementById('aiPanelCount') as HTMLInputElement;
    const aiPanelCountValue = document.getElementById('aiPanelCountValue') as HTMLSpanElement;
    const aiSunshineTimeSlider = document.getElementById('aiSunshineTime') as HTMLInputElement;
    const aiSunshineTimeValue = document.getElementById('aiSunshineTimeValue') as HTMLSpanElement;
    const aiAngleSlider = document.getElementById('aiAngle') as HTMLInputElement;
    const aiAngleValue = document.getElementById('aiAngleValue') as HTMLSpanElement;

    aiPanelCountSlider.addEventListener('input', () => {
        aiPanelCountValue.textContent = aiPanelCountSlider.value;
    });

    aiSunshineTimeSlider.addEventListener('input', () => {
        aiSunshineTimeValue.textContent = aiSunshineTimeSlider.value;
    });

    aiAngleSlider.addEventListener('input', () => {
        aiAngleValue.textContent = aiAngleSlider.value;
    });
});

