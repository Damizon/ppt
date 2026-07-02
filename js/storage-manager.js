(function () {
    const localStorageApi = window.ProdTimerLocalStorage;
    const fileStorageApi = window.ProdTimerFileStorage;

    let activeStorage = null;
    let mode = 'disconnected';

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
        } else if (fileStorageApi.hasRememberedFolder && fileStorageApi.hasRememberedFolder()) {
            mode = 'remembered';
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

        activeStorage = null;
        mode = 'disconnected';
    }

    function getStorageStatus() {
        return {
            mode,
            sharedSupported: Boolean(fileStorageApi && fileStorageApi.isSupported()),
            sharedConnected: mode === 'shared',
            sharedRemembered: mode === 'remembered',
            requiresConnection: true
        };
    }

    async function loadHistory() {
        if (!activeStorage) {
            return [];
        }

        return activeStorage.loadHistory();
    }

    async function loadAllHistory() {
        if (!activeStorage) {
            return [];
        }

        if (activeStorage.loadAllHistory) {
            return activeStorage.loadAllHistory();
        }

        return activeStorage.loadHistory();
    }

    async function saveHistory(history) {
        requireStorageConnection();

        if (activeStorage.saveHistory) {
            return activeStorage.saveHistory(history);
        }

        return Promise.resolve();
    }

    async function addHistoryEntry(entry) {
        requireStorageConnection();
        return activeStorage.addHistoryEntry(entry);
    }

    async function loadCalibrationSettings(defaultSettings) {
        if (!activeStorage) {
            return defaultSettings;
        }

        return activeStorage.loadCalibrationSettings(defaultSettings);
    }

    async function saveCalibrationSettings(settings) {
        requireStorageConnection();
        return activeStorage.saveCalibrationSettings(settings);
    }

    async function loadCalibrationPresets(defaultSettings) {
        if (!activeStorage) {
            return [createDefaultPreset(defaultSettings)];
        }

        return activeStorage.loadCalibrationPresets(defaultSettings);
    }

    async function saveCalibrationPresets(presets) {
        requireStorageConnection();
        return activeStorage.saveCalibrationPresets(presets);
    }

    async function loadActiveCalibrationPreset(defaultSettings) {
        if (!activeStorage) {
            return createDefaultPreset(defaultSettings);
        }

        return activeStorage.loadActiveCalibrationPreset(defaultSettings);
    }

    async function saveActiveCalibrationPresetId(id) {
        requireStorageConnection();
        return activeStorage.saveActiveCalibrationPresetId(id);
    }

    function requireStorageConnection() {
        if (!activeStorage) {
            throw new Error('Shared data folder is not connected. Click CONNECT DATA FOLDER and select the data folder located next to this app.');
        }
    }

    function createDefaultPreset(defaultSettings) {
        return {
            id: localStorageApi.DEFAULT_PRESET_ID,
            name: 'Default',
            settings: defaultSettings,
            createdAt: null,
            updatedAt: null
        };
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
