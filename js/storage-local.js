(function () {
    const STORAGE_KEY = 'genericProdLog';
    const SETTINGS_KEY = 'prodTimerCalibrationSettings';
    const PRESETS_KEY = 'prodTimerCalibrationPresets';
    const ACTIVE_PRESET_KEY = 'prodTimerActiveCalibrationPresetId';
    const HISTORY_LIMIT = 5;
    const DEFAULT_PRESET_ID = 'default';

    function loadHistory() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function addHistoryEntry(entry) {
        const history = loadHistory();
        history.unshift(entry);

        if (history.length > HISTORY_LIMIT) {
            history.pop();
        }

        saveHistory(history);
        return history;
    }

    function loadCalibrationSettings(defaultSettings) {
        const activePreset = loadActiveCalibrationPreset(defaultSettings);
        return Object.assign({}, defaultSettings, activePreset.settings);
    }

    function saveCalibrationSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function loadCalibrationPresets(defaultSettings) {
        const savedPresets = JSON.parse(localStorage.getItem(PRESETS_KEY)) || [];
        const legacySettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || null;
        const presets = [createDefaultPreset(defaultSettings)];

        if (legacySettings && savedPresets.length === 0) {
            presets.push({
                id: 'legacy-active',
                name: 'Saved Calibration',
                settings: Object.assign({}, defaultSettings, legacySettings),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        savedPresets.forEach((preset) => {
            if (preset.id !== DEFAULT_PRESET_ID) {
                presets.push(normalizePreset(preset, defaultSettings));
            }
        });

        return dedupePresets(presets);
    }

    function saveCalibrationPresets(presets) {
        const customPresets = presets.filter((preset) => preset.id !== DEFAULT_PRESET_ID);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(customPresets));
    }

    function loadActiveCalibrationPreset(defaultSettings) {
        const presets = loadCalibrationPresets(defaultSettings);
        const activePresetId = localStorage.getItem(ACTIVE_PRESET_KEY) || DEFAULT_PRESET_ID;
        return presets.find((preset) => preset.id === activePresetId) || presets[0];
    }

    function saveActiveCalibrationPresetId(id) {
        localStorage.setItem(ACTIVE_PRESET_KEY, id);
    }

    function createCalibrationPreset(name, settings) {
        const now = new Date().toISOString();

        return {
            id: createId(),
            name: name || 'New Calibration',
            settings,
            createdAt: now,
            updatedAt: now
        };
    }

    function createDefaultPreset(defaultSettings) {
        return {
            id: DEFAULT_PRESET_ID,
            name: 'Default',
            settings: defaultSettings,
            createdAt: null,
            updatedAt: null
        };
    }

    function normalizePreset(preset, defaultSettings) {
        return {
            id: preset.id || createId(),
            name: preset.name || 'Unnamed Calibration',
            settings: Object.assign({}, defaultSettings, preset.settings || {}),
            createdAt: preset.createdAt || new Date().toISOString(),
            updatedAt: preset.updatedAt || new Date().toISOString()
        };
    }

    function dedupePresets(presets) {
        const seen = new Set();

        return presets.filter((preset) => {
            if (seen.has(preset.id)) {
                return false;
            }

            seen.add(preset.id);
            return true;
        });
    }

    function createId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    window.ProdTimerStorage = {
        loadHistory,
        saveHistory,
        addHistoryEntry,
        loadCalibrationSettings,
        saveCalibrationSettings,
        loadCalibrationPresets,
        saveCalibrationPresets,
        loadActiveCalibrationPreset,
        saveActiveCalibrationPresetId,
        createCalibrationPreset,
        DEFAULT_PRESET_ID
    };
})();
