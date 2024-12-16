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
    setTimeout(() => {
        getInfoData();
        console.log(`System Version ${version}`);
    }, 3000)


    //InnerHtmlGameSection
    inputHtml();
    fetchAndDisplayHTML("https://gamelist1990.github.io/gamelist1990/version/update.html", "UpdateSection")


    // メインプロセスから設定を受け取る
    window.api.receive('load-settings', (data: ConfigData) => {
        ConfigData = data;
        console.log(JSON.stringify(data));
        (document.getElementById('aiProvider') as HTMLSelectElement).value = ConfigData.settingsData.provider;
        (document.getElementById('api') as HTMLInputElement).value = ConfigData.settingsData.token;
    });


    function inputHtml() {
        const VersionP = document.getElementById("version");
        setTimeout(() => {
            if (VersionP != null && version !== null)
                VersionP.innerHTML = `現在のバージョンは${version}α版です`;
        }, 2000)
    }




    async function fetchAndDisplayHTML(url: string | URL | Request, elementId: string) {
        try {

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const html = await response.text();
            const element = document.getElementById(elementId);
            if (element !== null) {
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
    const panelAreaInput = document.getElementById('panelArea') as HTMLInputElement;
    const efficiencyInput = document.getElementById('efficiency') as HTMLInputElement;
    const sunshineTimeInput = document.getElementById('sunshineTime') as HTMLInputElement;
    const electricityCostInput = document.getElementById('electricityCost') as HTMLInputElement;
    const co2ReductionRateInput = document.getElementById('co2ReductionRate') as HTMLInputElement;

    const analyzeButton = document.getElementById('analyzeButton') as HTMLButtonElement;
    const resultDiv = document.getElementById('result') as HTMLDivElement;

    analyzeButton.addEventListener('click', () => {
        const panelArea = parseFloat(panelAreaInput.value);
        const efficiency = parseFloat(efficiencyInput.value) / 100; // パーセントを小数に変換
        const sunshineTime = parseFloat(sunshineTimeInput.value);
        const electricityCost = parseFloat(electricityCostInput.value);
        const co2ReductionRate = parseFloat(co2ReductionRateInput.value) / 100;

        // 入力値の検証
        if (panelArea <= 0 || efficiency <= 0 || sunshineTime <= 0 || electricityCost <= 0) {
            resultDiv.innerHTML = '入力値が正しくありません。すべての項目に0より大きい値を入力してください。';
            return;
        }

        if (efficiency > 1) {
            resultDiv.innerHTML = '発電効率は0~100%で設定してください。';
            return;
        }

        if (sunshineTime > 24) {
            resultDiv.innerHTML = '時間は24時間までの範囲で入力してね';
            return;
        }


        if (co2ReductionRate > 1) {
            resultDiv.innerHTML = 'CO2削減率は0~100%で設定してください。';
            return;
        }



        // 発電量の計算
        const powerGeneration = panelArea * efficiency * sunshineTime;

        // 費用対効果の計算 (1日あたりの節約額)
        const dailySaving = powerGeneration * electricityCost;

        // 温暖化抑制率の計算 (1日あたりのCO2削減量)
        const dailyCo2Reduction = powerGeneration * co2ReductionRate;


        let adviceText = '';
        adviceText += `
         <p>
           <b>発電量</b>: ${powerGeneration.toFixed(2)} kWh/日 <br>
           <b>節約額</b>: ${dailySaving.toFixed(0)} 円/日 <br>
            <b>CO2削減量</b>: ${dailyCo2Reduction.toFixed(2)} kg/日 
         </p>
    `;

        if (dailySaving <= 100) {
            adviceText += `<p>
        節約効果を上げるための提案をいたします。
      </p>
        <ul>
              <li>パネルの数を増やす</li>
              <li>日当たりの良い場所に設置する</li>
              <li>パネルの角度を調整する</li>
              <li>定期的にパネルの清掃を行い、効率を維持する</li>
              <li>高効率のパネルに交換する</li>
            </ul>
        `
        } else if (dailySaving > 100 && dailySaving <= 300) {
            adviceText += `<p>
        節約効果は比較的にありますがさらなる向上が見込めます。
      </p>
        <ul>
              <li>パネルの角度を少し調整する</li>
              <li>日陰になる部分を減らす、反射光を利用するなど、設置場所を見直す</li>
              <li>パネルの清掃を定期的に行う</li>
            </ul>
        `
        } else {
            adviceText += `<p>
       非常に良好な結果です！
      </p>
        <ul>
            <li>蓄電システムを導入し、余剰電力を有効活用する</li>
            <li>定期的なメンテナンスを行い、システムの最適な状態を維持する</li>
          </ul>
        `
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

            const aiPanelArea = parseFloat((document.getElementById('aiPanelArea') as HTMLInputElement).value);
            const aiEfficiency = parseFloat((document.getElementById('aiEfficiency') as HTMLInputElement).value) / 100;
            const aiSunshineTime = parseFloat((document.getElementById('aiSunshineTime') as HTMLInputElement).value);
            const aiElectricityCost = parseFloat((document.getElementById('aiElectricityCost') as HTMLInputElement).value);
            const aiCo2ReductionRate = parseFloat((document.getElementById('aiCo2ReductionRate') as HTMLInputElement).value) / 100;
            const aiInstallationTime = (document.getElementById('aiInstallationTime') as HTMLInputElement).value;
            const aiGeneration = (document.getElementById('aiGeneration') as HTMLInputElement).value;
            const aiLocation = (document.getElementById('aiLocation') as HTMLInputElement).value;
            const aiAngle = (document.getElementById('aiAngle') as HTMLInputElement).value;
            const aiSystemCapacity = (document.getElementById('aiSystemCapacity') as HTMLInputElement).value;
            const aiPurpose = (document.getElementById('aiPurpose') as HTMLInputElement).value;



            // 発電量の計算
            const powerGeneration = aiPanelArea * aiEfficiency * aiSunshineTime;

            // 費用対効果の計算 (1日あたりの節約額)
            const dailySaving = powerGeneration * aiElectricityCost;

            // 温暖化抑制率の計算 (1日あたりのCO2削減量)
            const dailyCo2Reduction = powerGeneration * aiCo2ReductionRate;


            const question = `太陽光発電のデータが次のような場合、
              希望する費用軽減効果と温暖化抑制はどれぐらいできますか？
             パネル面積: ${aiPanelArea} m², 発電効率: ${aiEfficiency * 100}%, 日照時間: ${aiSunshineTime}時間, 
             1日の総発電量(kWh): ${aiGeneration}, どこに住んでいるか: ${aiLocation},
              ソーラーパネルの設置角度: ${aiAngle}°, 設置した年: ${aiInstallationTime}, 
              太陽光発電システム全体の容量(kW): ${aiSystemCapacity}, 
               費用対効果(1日あたり): ${dailySaving.toFixed(0)}円,温暖化抑制率(1日あたり): ${dailyCo2Reduction.toFixed(2)}kg,
              アドバイスを求める目的: ${aiPurpose}`;


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

    const aiSunshineTimeSlider = document.getElementById('aiSunshineTime') as HTMLInputElement;
    const aiSunshineTimeValue = document.getElementById('aiSunshineTimeValue') as HTMLSpanElement;
    const aiAngleSlider = document.getElementById('aiAngle') as HTMLInputElement;
    const aiAngleValue = document.getElementById('aiAngleValue') as HTMLSpanElement;



    aiSunshineTimeSlider.addEventListener('input', () => {
        aiSunshineTimeValue.textContent = aiSunshineTimeSlider.value;
    });

    aiAngleSlider.addEventListener('input', () => {
        aiAngleValue.textContent = aiAngleSlider.value;
    });


    const simulationResultDiv = document.getElementById('simulationResult') as HTMLDivElement;
    const simulateButton = document.getElementById('simulateButton') as HTMLButtonElement;

    simulateButton.addEventListener('click', () => {
        const averageDailyConsumption = parseFloat((document.getElementById('averageDailyConsumption') as HTMLInputElement).value);
        const solarPanelArea = parseFloat((document.getElementById('solarPanelArea') as HTMLInputElement).value);
        const efficiency = parseFloat((document.getElementById('efficiency') as HTMLInputElement).value) / 100; // Convert percentage to decimal
        const sunshineTime = parseFloat((document.getElementById('sunshineTime') as HTMLInputElement).value);
        const electricityCost = parseFloat((document.getElementById('electricityCost') as HTMLInputElement).value);
        const co2ReductionRate = parseFloat((document.getElementById('co2ReductionRate') as HTMLInputElement).value) / 1000; // CO2排出量

        if (averageDailyConsumption <= 0 || solarPanelArea <= 0 || efficiency <= 0 || sunshineTime <= 0 || electricityCost <= 0) {
            simulationResultDiv.innerHTML = '入力値が正しくありません。すべての項目に0より大きい値を入力してください。';
            return;
        }

        if (efficiency > 1) {
            simulationResultDiv.innerHTML = '発電効率は0~100%で設定してください。';
            return;
        }

        if (sunshineTime > 24) {
            simulationResultDiv.innerHTML = '時間は24時間までの範囲で入力してね';
            return;
        }


        //  Calculate electricity cost and CO2 emission WITHOUT solar panels
        const costWithoutSolar = averageDailyConsumption * electricityCost;
        const co2EmissionWithoutSolar = averageDailyConsumption * co2ReductionRate;

        // Calculate power generation WITH solar panels
        const powerGeneration = solarPanelArea * efficiency * sunshineTime;

        // Calculate cost savings
        const costWithSolar = (averageDailyConsumption - powerGeneration) * electricityCost;

        // Calculate CO2 reduction
        const co2EmissionWithSolar = (averageDailyConsumption - powerGeneration) * co2ReductionRate;


        const costSaving = costWithoutSolar - costWithSolar;
        const co2Reduction = co2EmissionWithoutSolar - co2EmissionWithSolar;
        simulationResultDiv.innerHTML = `
            <p><b>結果</b></p>
             <p><b>太陽光パネルなし</b></p>
             <p>電気料金: ${costWithoutSolar.toFixed(2)} 円/日</p>
              <p>CO2排出量: ${co2EmissionWithoutSolar.toFixed(2)} g/日</p>
            <p><b>太陽光パネルあり</b></p>
            <p>発電量: ${powerGeneration.toFixed(2)} kWh/日</p>
             <p>電気料金: ${costWithSolar.toFixed(2)} 円/日</p>
            <p>CO2排出量: ${co2EmissionWithSolar.toFixed(2)} g/日</p>
             <p><b>削減効果</b></p>
             <p>節約額: ${costSaving.toFixed(0)} 円/日</p>
             <p>CO2削減量: ${co2Reduction.toFixed(2)} g/日</p>
        `;
    });
});