(function () {
    const localStorageApi = window.ProdTimerLocalStorage;
    const fileStorageApi = window.ProdTimerFileStorage;

    let activeStorage = localStorageApi;
    let mode = 'local';

    async function init(defaultSettings) {
        if (!fileStorageApi) {
            return;
        }

        let restored = false;

        try {
            restored = await fileStorageApi.restore(defaultSettings);
        } catch (error) {
            restored = false;
        }

        if (restored) {
            activeStorage = fileStorageApi;
            mode = 'shared';
        }
    }

    async function connectSharedFolder(defaultSettings) {
        const connected = await fileStorageApi.connect(defaultSettings);

        if (!connected) {
            return false;
        }

        activeStorage = fileStorageApi;
        mode = 'shared';
        return true;
    }

    async function disconnectSharedFolder() {
        if (fileStorageApi) {
            await fileStorageApi.disconnect();
        }

        activeStorage = localStorageApi;
        mode = 'local';
    }

    function getStorageStatus() {
        return {
            mode,
            sharedSupported: Boolean(fileStorageApi && fileStorageApi.isSupported()),
            sharedConnected: mode === 'shared'
        };
    }

    async function loadHistory() {
        return activeStorage.loadHistory();
    }

    async function loadAllHistory() {
        if (activeStorage.loadAllHistory) {
            return activeStorage.loadAllHistory();
        }

        return activeStorage.loadHistory();
    }

    async function saveHistory(history) {
        if (activeStorage.saveHistory) {
            return activeStorage.saveHistory(history);
        }

        return Promise.resolve();
    }

    async function addHistoryEntry(entry) {
        return activeStorage.addHistoryEntry(entry);
    }

    async function loadCalibrationSettings(defaultSettings) {
        return activeStorage.loadCalibrationSettings(defaultSettings);
    }

    async function saveCalibrationSettings(settings) {
        return activeStorage.saveCalibrationSettings(settings);
    }

    async function loadCalibrationPresets(defaultSettings) {
        return activeStorage.loadCalibrationPresets(defaultSettings);
    }

    async function saveCalibrationPresets(presets) {
        return activeStorage.saveCalibrationPresets(presets);
    }

    async function loadActiveCalibrationPreset(defaultSettings) {
        return activeStorage.loadActiveCalibrationPreset(defaultSettings);
    }

    async function saveActiveCalibrationPresetId(id) {
        return activeStorage.saveActiveCalibrationPresetId(id);
    }

    window.ProdTimerStorage = {
        init,
        connectSharedFolder,
        disconnectSharedFolder,
        getStorageStatus,
        loadHistory,
        loadAllHistory,
        saveHistory,
        addHistoryEntry,
        loadCalibrationSettings,
        saveCalibrationSettings,
        loadCalibrationPresets,
        saveCalibrationPresets,
        loadActiveCalibrationPreset,
        saveActiveCalibrationPresetId,
        createCalibrationPreset: localStorageApi.createCalibrationPreset,
        DEFAULT_PRESET_ID: localStorageApi.DEFAULT_PRESET_ID
    };
})();
