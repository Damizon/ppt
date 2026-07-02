(function () {
    const calculator = window.ProdTimerCalculator;
    const storage = window.ProdTimerStorage;

    const elements = {};
    let presets = [];
    let selectedPresetId;
    let activePresetId;

    window.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheElements();
        await storage.init(calculator.DEFAULT_SETTINGS);
        presets = await storage.loadCalibrationPresets(calculator.DEFAULT_SETTINGS);
        activePresetId = (await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS)).id;
        selectedPresetId = activePresetId;
        bindEvents();
        renderStorageStatus();
        renderPresetOptions();
        loadPreset(selectedPresetId);
        updateKnownJob();
        updatePreview();
    }

    function cacheElements() {
        [
            'baseAllowance',
            'maxFactor',
            'rampCurve',
            'batchSensitivity',
            'shiftHours',
            'sampleQty',
            'totalQty',
            'sampleMinutes',
            'actualHours',
            'baseAllowanceValue',
            'maxFactorValue',
            'rampCurveValue',
            'batchSensitivityValue',
            'shiftHoursValue',
            'knownCalculated',
            'knownActual',
            'knownCorrection',
            'previewIdeal',
            'previewReal',
            'previewFactor',
            'previewError',
            'presetSelect',
            'presetName',
            'activePresetName',
            'loadPresetBtn',
            'saveAsPresetBtn',
            'updatePresetBtn',
            'deletePresetBtn',
            'loadDefaultsBtn',
            'autoFitBtn',
            'storageStatus',
            'connectStorageBtn',
            'disconnectStorageBtn'
        ].forEach((id) => {
            elements[id] = document.getElementById(id);
        });
    }

    function bindEvents() {
        getSettingInputs().forEach((input) => {
            input.addEventListener('input', updatePreview);
        });

        [elements.sampleQty, elements.totalQty, elements.sampleMinutes, elements.actualHours].forEach((input) => {
            input.addEventListener('input', updatePreview);
        });

        [elements.knownCalculated, elements.knownActual].forEach((input) => {
            input.addEventListener('input', updateKnownJob);
        });

        elements.presetSelect.addEventListener('change', () => {
            selectedPresetId = elements.presetSelect.value;
            loadPreset(selectedPresetId);
        });

        elements.loadPresetBtn.addEventListener('click', async () => {
            loadPreset(elements.presetSelect.value);
            await setActivePreset(elements.presetSelect.value);
        });

        elements.saveAsPresetBtn.addEventListener('click', saveAsNewPreset);
        elements.updatePresetBtn.addEventListener('click', updateSelectedPreset);
        elements.deletePresetBtn.addEventListener('click', deleteSelectedPreset);
        elements.connectStorageBtn.addEventListener('click', connectSharedStorage);
        elements.disconnectStorageBtn.addEventListener('click', disconnectSharedStorage);

        elements.loadDefaultsBtn.addEventListener('click', () => {
            setSettings(calculator.DEFAULT_SETTINGS);
            elements.presetName.value = 'Default';
            updatePreview();
        });

        elements.autoFitBtn.addEventListener('click', autoFitBaseAllowance);
    }

    function renderPresetOptions() {
        elements.presetSelect.innerHTML = '';

        presets.forEach((preset) => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.innerText = preset.name;
            elements.presetSelect.appendChild(option);
        });

        elements.presetSelect.value = selectedPresetId;
        renderPresetActions();
    }

    function renderPresetActions() {
        const selectedPreset = findPreset(selectedPresetId);
        const isDefault = selectedPresetId === storage.DEFAULT_PRESET_ID;
        const activePreset = findPreset(activePresetId);

        elements.presetName.value = selectedPreset ? selectedPreset.name : '';
        elements.activePresetName.innerText = activePreset ? activePreset.name : 'Default';
        elements.updatePresetBtn.disabled = isDefault;
        elements.deletePresetBtn.disabled = isDefault;
    }

    function loadPreset(id) {
        const preset = findPreset(id) || presets[0];

        selectedPresetId = preset.id;
        elements.presetSelect.value = selectedPresetId;
        setSettings(preset.settings);
        renderPresetActions();
        updatePreview();
    }

    async function connectSharedStorage() {
        try {
            await storage.connectSharedFolder(calculator.DEFAULT_SETTINGS);
            presets = await storage.loadCalibrationPresets(calculator.DEFAULT_SETTINGS);
            activePresetId = (await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS)).id;
            selectedPresetId = activePresetId;
            renderStorageStatus();
            renderPresetOptions();
            loadPreset(selectedPresetId);
        } catch (error) {
            alert(error.message || 'Shared data folder connection failed.');
        }
    }

    async function disconnectSharedStorage() {
        await storage.disconnectSharedFolder();
        presets = await storage.loadCalibrationPresets(calculator.DEFAULT_SETTINGS);
        activePresetId = (await storage.loadActiveCalibrationPreset(calculator.DEFAULT_SETTINGS)).id;
        selectedPresetId = activePresetId;
        renderStorageStatus();
        renderPresetOptions();
        loadPreset(selectedPresetId);
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

    async function saveAsNewPreset() {
        const preset = storage.createCalibrationPreset(readPresetName(), readSettings());

        presets.push(preset);
        selectedPresetId = preset.id;
        try {
            await savePresetList();
            await setActivePreset(preset.id);
            renderPresetOptions();
            alert('Calibration preset saved.');
        } catch (error) {
            presets = presets.filter((item) => item.id !== preset.id);
            selectedPresetId = activePresetId;
            renderPresetOptions();
            alert(error.message || 'Shared data folder is not connected.');
        }
    }

    async function updateSelectedPreset() {
        if (selectedPresetId === storage.DEFAULT_PRESET_ID) {
            return;
        }

        const preset = findPreset(selectedPresetId);

        if (!preset) {
            return;
        }

        preset.name = readPresetName();
        preset.settings = readSettings();
        preset.updatedAt = new Date().toISOString();
        try {
            await savePresetList();
            await setActivePreset(preset.id);
            renderPresetOptions();
            alert('Calibration preset updated.');
        } catch (error) {
            alert(error.message || 'Shared data folder is not connected.');
        }
    }

    async function deleteSelectedPreset() {
        if (selectedPresetId === storage.DEFAULT_PRESET_ID) {
            return;
        }

        const preset = findPreset(selectedPresetId);

        if (!preset || !confirm('Delete calibration preset "' + preset.name + '"?')) {
            return;
        }

        presets = presets.filter((item) => item.id !== selectedPresetId);

        if (activePresetId === selectedPresetId) {
            await setActivePreset(storage.DEFAULT_PRESET_ID);
        }

        selectedPresetId = activePresetId;
        try {
            await savePresetList();
            renderPresetOptions();
            loadPreset(selectedPresetId);
        } catch (error) {
            alert(error.message || 'Shared data folder is not connected.');
        }
    }

    async function setActivePreset(id) {
        activePresetId = id;
        await storage.saveActiveCalibrationPresetId(id);

        const activePreset = findPreset(activePresetId);
        if (activePreset) {
            await storage.saveCalibrationSettings(activePreset.settings);
        }

        renderPresetActions();
    }

    function updateKnownJob() {
        const calculated = readKnownCalculatedHours();
        const actual = readKnownActualHours();
        const correction = calculated > 0 ? ((actual / calculated) - 1) * 100 : 0;

        elements.knownCorrection.innerText = formatSignedPercent(correction);
    }

    function updatePreview() {
        const settings = readSettings();
        updateSliderLabels(settings);

        const result = calculator.calculateProductionEstimate({
            testQty: elements.sampleQty.value,
            totalQty: elements.totalQty.value,
            elapsedMs: readSampleMinutes() * 60 * 1000
        }, settings);

        if (!result) {
            return;
        }

        const actualHours = readActualHours();
        const errorPercent = actualHours > 0
            ? ((result.real.totalHours / actualHours) - 1) * 100
            : 0;

        elements.previewIdeal.innerText = result.ideal.totalHours.toFixed(2) + ' h';
        elements.previewReal.innerText = result.real.totalHours.toFixed(2) + ' h';
        elements.previewFactor.innerText = '+' + result.factor.percent.toFixed(1) + '%';
        elements.previewError.innerText = formatSignedPercent(errorPercent);
    }

    function autoFitBaseAllowance() {
        const calculatedHours = readKnownCalculatedHours();
        const actualHours = readKnownActualHours();
        if (calculatedHours <= 0 || actualHours <= 0) {
            return;
        }

        const baseAllowance = ((actualHours / calculatedHours) - 1) * 100;

        elements.baseAllowance.value = clamp(baseAllowance, 0, 60).toFixed(1);
        updatePreview();
    }

    function readSettings() {
        return calculator.normalizeSettings({
            baseAllowance: elements.baseAllowance.value,
            maxFactor: elements.maxFactor.value,
            rampCurve: elements.rampCurve.value,
            batchSensitivity: elements.batchSensitivity.value,
            shiftHours: elements.shiftHours.value
        });
    }

    function setSettings(settings) {
        const normalized = calculator.normalizeSettings(settings);

        elements.baseAllowance.value = normalized.baseAllowance;
        elements.maxFactor.value = normalized.maxFactor;
        elements.rampCurve.value = normalized.rampCurve;
        elements.batchSensitivity.value = normalized.batchSensitivity;
        elements.shiftHours.value = normalized.shiftHours;
        updateSliderLabels(normalized);
    }

    function updateSliderLabels(settings) {
        elements.baseAllowanceValue.innerText = settings.baseAllowance.toFixed(1);
        elements.maxFactorValue.innerText = settings.maxFactor.toFixed(0);
        elements.rampCurveValue.innerText = settings.rampCurve.toFixed(1);
        elements.batchSensitivityValue.innerText = settings.batchSensitivity.toFixed(0);
        elements.shiftHoursValue.innerText = settings.shiftHours.toFixed(1).replace('.0', '');
    }

    function getSettingInputs() {
        return [
            elements.baseAllowance,
            elements.maxFactor,
            elements.rampCurve,
            elements.batchSensitivity,
            elements.shiftHours
        ];
    }

    function readSampleMinutes() {
        return Number.parseFloat(elements.sampleMinutes.value) || 0;
    }

    function readActualHours() {
        return Number.parseFloat(elements.actualHours.value) || 0;
    }

    function readKnownCalculatedHours() {
        return Number.parseFloat(elements.knownCalculated.value) || 0;
    }

    function readKnownActualHours() {
        return Number.parseFloat(elements.knownActual.value) || 0;
    }

    function readPresetName() {
        const name = elements.presetName.value.trim();
        return name || 'New Calibration';
    }

    function findPreset(id) {
        return presets.find((preset) => preset.id === id);
    }

    async function savePresetList() {
        await storage.saveCalibrationPresets(presets);
    }

    function formatSignedPercent(value) {
        const prefix = value > 0 ? '+' : '';
        return prefix + value.toFixed(1) + '%';
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
})();
