(function () {
    const format = window.ProdTimerFormat;
    const calculator = window.ProdTimerCalculator;
    const storage = window.ProdTimerStorage;
    const timerFactory = window.ProdTimerTimer;

    const elements = {};
    let timer;
    let calibrationSettings;
    let activeCalibrationPreset;

    window.addEventListener('DOMContentLoaded', init);

    window.addEventListener('beforeunload', (event) => {
        if (!timer) {
            return;
        }

        const state = timer.getState();

        if (state.running || state.elapsedTime > 0) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    async function init() {
        cacheElements();

        timer = timerFactory.createTimer({
            onChange: handleTimerChange
        });

        await storage.init(calculator.DEFAULT_SETTINGS);
        activeCalibrationPreset = await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS);
        calibrationSettings = activeCalibrationPreset.settings;
        bindEvents();
        renderStorageStatus();
        renderActiveCalibration();
        updateLogDisplay(await storage.loadHistory());
        calculate();
    }

    function cacheElements() {
        elements.orderRef = document.getElementById('orderRef');
        elements.testQty = document.getElementById('testQty');
        elements.totalQty = document.getElementById('totalQty');
        elements.hours = document.getElementById('h');
        elements.minutes = document.getElementById('m');
        elements.seconds = document.getElementById('s');
        elements.mainBtn = document.getElementById('mainBtn');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.saveBtn = document.getElementById('saveBtn');
        elements.logContainer = document.getElementById('logContainer');
        elements.resMP = document.getElementById('resMP');
        elements.resUnitClockIdeal = document.getElementById('resUnitClockIdeal');
        elements.estClockIdeal = document.getElementById('estClockIdeal');
        elements.estDec = document.getElementById('estDec');
        elements.factorApplied = document.getElementById('factorApplied');
        elements.realMP = document.getElementById('realMP');
        elements.realUnitClock = document.getElementById('realUnitClock');
        elements.realEstClock = document.getElementById('realEstClock');
        elements.realEstDec = document.getElementById('realEstDec');
        elements.activeCalibration = document.getElementById('activeCalibration');
        elements.storageStatus = document.getElementById('storageStatus');
        elements.connectStorageBtn = document.getElementById('connectStorageBtn');
        elements.disconnectStorageBtn = document.getElementById('disconnectStorageBtn');
    }

    function bindEvents() {
        elements.orderRef.addEventListener('blur', validateFRM);
        elements.testQty.addEventListener('input', calculate);
        elements.totalQty.addEventListener('input', calculate);
        elements.mainBtn.addEventListener('click', () => timer.toggle());
        elements.resetBtn.addEventListener('click', resetAll);
        elements.saveBtn.addEventListener('click', saveToLog);
        elements.connectStorageBtn.addEventListener('click', connectSharedStorage);
        elements.disconnectStorageBtn.addEventListener('click', disconnectSharedStorage);

        [elements.hours, elements.minutes, elements.seconds].forEach((input) => {
            input.addEventListener('change', manualInput);
            input.addEventListener('click', () => input.select());
        });
    }

    function validateFRM() {
        if (elements.orderRef.value && !elements.orderRef.value.toUpperCase().startsWith('FRM')) {
            elements.orderRef.value = 'FRM' + elements.orderRef.value;
        }
    }

    function manualInput() {
        const hours = Number.parseInt(elements.hours.value, 10) || 0;
        const minutes = Number.parseInt(elements.minutes.value, 10) || 0;
        const seconds = Number.parseInt(elements.seconds.value, 10) || 0;

        timer.setElapsedFromParts(hours, minutes, seconds);
    }

    function resetAll() {
        const state = timer.getState();

        if (state.elapsedTime > 0 && !confirm('Clear all data?')) {
            return;
        }

        timer.reset();
        elements.orderRef.value = '';
        calculate();
    }

    function handleTimerChange(state) {
        refreshInputs(state.elapsedTime);
        elements.mainBtn.className = state.running ? 'main-btn pause' : 'main-btn start';
        calculate();
    }

    function refreshInputs(elapsedTime) {
        const hh = Math.floor(elapsedTime / 3600000);
        const mm = Math.floor((elapsedTime % 3600000) / 60000);
        const ss = Math.floor((elapsedTime % 60000) / 1000);

        if (document.activeElement.id !== 'h') {
            elements.hours.value = hh.toString().padStart(2, '0');
        }

        if (document.activeElement.id !== 'm') {
            elements.minutes.value = mm.toString().padStart(2, '0');
        }

        if (document.activeElement.id !== 's') {
            elements.seconds.value = ss.toString().padStart(2, '0');
        }
    }

    function calculate() {
        const state = timer ? timer.getState() : { elapsedTime: 0 };
        const result = calculator.calculateProductionEstimate({
            testQty: elements.testQty.value,
            totalQty: elements.totalQty.value,
            elapsedMs: state.elapsedTime
        }, calibrationSettings);

        if (!result) {
            return;
        }

        elements.resMP.innerText = result.ideal.mp.toFixed(3);
        elements.resUnitClockIdeal.innerText = format.formatHms(result.ideal.unitSeconds);
        elements.estDec.innerText = result.ideal.totalHours.toFixed(2) + ' h';
        elements.estClockIdeal.innerText = format.formatHms(result.ideal.totalHours * 3600);
        elements.factorApplied.innerText = '+' + result.factor.percent.toFixed(1) + '%';
        elements.realMP.innerText = result.real.mp.toFixed(3);
        elements.realUnitClock.innerText = format.formatHms(result.real.unitSeconds);
        elements.realEstDec.innerText = result.real.totalHours.toFixed(2) + ' h';
        elements.realEstClock.innerText = format.formatHms(result.real.totalHours * 3600);
    }

    function renderActiveCalibration() {
        if (!elements.activeCalibration) {
            return;
        }

        elements.activeCalibration.innerText = activeCalibrationPreset.name;
    }

    async function connectSharedStorage() {
        try {
            await storage.connectSharedFolder(calculator.DEFAULT_SETTINGS);
            activeCalibrationPreset = await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS);
            calibrationSettings = activeCalibrationPreset.settings;
            renderStorageStatus();
            renderActiveCalibration();
            updateLogDisplay(await storage.loadHistory());
            calculate();
        } catch (error) {
            alert(error.message || 'Shared data folder connection failed.');
        }
    }

    async function disconnectSharedStorage() {
        await storage.disconnectSharedFolder();
        activeCalibrationPreset = await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS);
        calibrationSettings = activeCalibrationPreset.settings;
        renderStorageStatus();
        renderActiveCalibration();
        updateLogDisplay(await storage.loadHistory());
        calculate();
    }

    function renderStorageStatus() {
        const status = storage.getStorageStatus();

        elements.storageStatus.innerText = getStorageStatusLabel(status);
        elements.connectStorageBtn.innerText = status.sharedRemembered ? 'RECONNECT DATA FOLDER' : 'CONNECT DATA FOLDER';
        elements.connectStorageBtn.disabled = !status.sharedSupported;
        elements.disconnectStorageBtn.disabled = !status.sharedConnected;
    }

    function getStorageStatusLabel(status) {
        if (status.sharedConnected) {
            return 'Shared Data Folder';
        }

        if (status.sharedRemembered) {
            return 'Data folder remembered';
        }

        return 'Folder not connected';
    }

    async function saveToLog() {
        const state = timer.getState();

        if (state.elapsedTime === 0) {
            return;
        }

        const entry = {
            id: elements.orderRef.value || 'FRM Unknown',
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            testQty: elements.testQty.value,
            totalQty: elements.totalQty.value,
            idealMP: elements.resMP.innerText,
            idealUnitTime: elements.resUnitClockIdeal.innerText,
            idealEstClock: elements.estClockIdeal.innerText,
            idealEst: elements.estDec.innerText,
            factor: elements.factorApplied.innerText,
            mp: elements.realMP.innerText,
            realUnitTime: elements.realUnitClock.innerText,
            realEstClock: elements.realEstClock.innerText,
            est: elements.realEstDec.innerText,
            duration: format.formatHms(state.elapsedTime / 1000)
        };

        try {
            const history = await storage.addHistoryEntry(entry);
            updateLogDisplay(history);
            alert('Log saved.');
        } catch (error) {
            alert(error.message || 'Shared data folder is not connected.');
        }
    }

    function updateLogDisplay(history) {
        elements.logContainer.innerHTML = '';

        history.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.innerHTML = `<div><strong>${item.id}</strong><br>
                             Measured: ${item.testQty} pcs in ${item.duration}<br>
                             Total: ${item.totalQty} pcs | Real Est: ${item.est}h</div>
                             <div class="log-meta"><span class="log-mp">Real MP: ${item.mp}</span><br>
                             <span class="log-time">${item.time}</span></div>`;
            elements.logContainer.appendChild(div);
        });
    }
})();
