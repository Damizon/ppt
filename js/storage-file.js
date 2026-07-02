(function () {
    const DB_NAME = 'prod-timer-file-storage';
    const DB_VERSION = 1;
    const HANDLE_STORE = 'handles';
    const DATA_FOLDER_HANDLE_KEY = 'data-folder';
    const PRESETS_FILE = 'calibration-presets.json';
    const ACTIVE_FILE = 'active-calibration.json';
    const LOG_FILE = 'production-log.txt';
    const HISTORY_LIMIT = 5;

    let directoryHandle = null;

    function isSupported() {
        return Boolean(window.showDirectoryPicker && window.indexedDB);
    }

    async function restore(defaultSettings) {
        if (!isSupported()) {
            return false;
        }

        directoryHandle = await loadHandle();

        if (!directoryHandle) {
            return false;
        }

        const hasPermission = await verifyPermission(directoryHandle, false);

        if (!hasPermission) {
            directoryHandle = null;
            return false;
        }

        await ensureFiles(defaultSettings);
        return true;
    }

    async function connect(defaultSettings) {
        if (!isSupported()) {
            throw new Error('Shared folder storage is not supported by this browser.');
        }

        directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });

        if (directoryHandle.name !== 'data' && !confirm('The selected folder is not named "data". Use this folder anyway?')) {
            directoryHandle = null;
            return false;
        }

        const hasPermission = await verifyPermission(directoryHandle, true);

        if (!hasPermission) {
            directoryHandle = null;
            throw new Error('Write permission was not granted for the selected folder.');
        }

        await saveHandle(directoryHandle);
        await ensureFiles(defaultSettings);
        return true;
    }

    async function disconnect() {
        directoryHandle = null;
        await deleteHandle();
    }

    function isConnected() {
        return Boolean(directoryHandle);
    }

    async function loadHistory() {
        if (!directoryHandle) {
            return [];
        }

        const text = await readTextFile(LOG_FILE, '');
        const entries = text
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map(parseLogLine)
            .filter(Boolean);

        return entries.slice(-HISTORY_LIMIT).reverse();
    }

    async function addHistoryEntry(entry) {
        const nextEntry = Object.assign({
            createdAt: new Date().toISOString()
        }, entry);
        const currentText = await readTextFile(LOG_FILE, '');
        const prefix = currentText && !currentText.endsWith('\n') ? '\n' : '';

        await appendTextFile(LOG_FILE, prefix + JSON.stringify(nextEntry) + '\n');
        return loadHistory();
    }

    async function loadCalibrationPresets(defaultSettings) {
        const presets = await readJsonFile(PRESETS_FILE, []);
        const normalized = presets.map((preset) => normalizePreset(preset, defaultSettings));

        if (!normalized.some((preset) => preset.id === 'default')) {
            normalized.unshift(createDefaultPreset(defaultSettings));
        }

        return normalized;
    }

    async function saveCalibrationPresets(presets) {
        await writeJsonFile(PRESETS_FILE, presets);
    }

    async function loadActiveCalibrationPreset(defaultSettings) {
        const presets = await loadCalibrationPresets(defaultSettings);
        const active = await readJsonFile(ACTIVE_FILE, { presetId: 'default' });

        return presets.find((preset) => preset.id === active.presetId) || presets[0];
    }

    async function saveActiveCalibrationPresetId(id) {
        await writeJsonFile(ACTIVE_FILE, { presetId: id });
    }

    async function loadCalibrationSettings(defaultSettings) {
        const preset = await loadActiveCalibrationPreset(defaultSettings);
        return Object.assign({}, defaultSettings, preset.settings);
    }

    async function saveCalibrationSettings() {
        return Promise.resolve();
    }

    async function ensureFiles(defaultSettings) {
        await ensureJsonFile(PRESETS_FILE, [createDefaultPreset(defaultSettings)]);
        await ensureJsonFile(ACTIVE_FILE, { presetId: 'default' });
        await ensureTextFile(LOG_FILE, '');
    }

    async function ensureJsonFile(name, fallback) {
        try {
            const text = await readTextFile(name, '');

            if (!text.trim()) {
                await writeJsonFile(name, fallback);
                return;
            }

            JSON.parse(text);
        } catch (error) {
            await writeJsonFile(name, fallback);
        }
    }

    async function ensureTextFile(name, fallback) {
        try {
            await readTextFile(name, fallback);
        } catch (error) {
            await writeTextFile(name, fallback);
        }
    }

    async function readJsonFile(name, fallback) {
        const text = await readTextFile(name, JSON.stringify(fallback, null, 2));
        return JSON.parse(text || JSON.stringify(fallback));
    }

    async function writeJsonFile(name, data) {
        await writeTextFile(name, JSON.stringify(data, null, 2) + '\n');
    }

    async function readTextFile(name, fallback) {
        const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
        const file = await fileHandle.getFile();
        const text = await file.text();

        if (!text && fallback !== undefined) {
            return fallback;
        }

        return text;
    }

    async function writeTextFile(name, text) {
        const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();

        await writable.write(text);
        await writable.close();
    }

    async function appendTextFile(name, text) {
        const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
        const file = await fileHandle.getFile();
        const writable = await fileHandle.createWritable({ keepExistingData: true });

        await writable.seek(file.size);
        await writable.write(text);
        await writable.close();
    }

    async function verifyPermission(handle, requestWrite) {
        const options = { mode: 'readwrite' };
        const query = await handle.queryPermission(options);

        if (query === 'granted') {
            return true;
        }

        if (!requestWrite) {
            return false;
        }

        return await handle.requestPermission(options) === 'granted';
    }

    async function loadHandle() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readonly');
            const request = tx.objectStore(HANDLE_STORE).get(DATA_FOLDER_HANDLE_KEY);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveHandle(handle) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readwrite');
            const request = tx.objectStore(HANDLE_STORE).put(handle, DATA_FOLDER_HANDLE_KEY);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteHandle() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readwrite');
            const request = tx.objectStore(HANDLE_STORE).delete(DATA_FOLDER_HANDLE_KEY);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(HANDLE_STORE)) {
                    db.createObjectStore(HANDLE_STORE);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function parseLogLine(line) {
        try {
            return JSON.parse(line);
        } catch (error) {
            return null;
        }
    }

    function createDefaultPreset(defaultSettings) {
        return {
            id: 'default',
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

    function createId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    window.ProdTimerFileStorage = {
        isSupported,
        restore,
        connect,
        disconnect,
        isConnected,
        loadHistory,
        addHistoryEntry,
        loadCalibrationSettings,
        saveCalibrationSettings,
        loadCalibrationPresets,
        saveCalibrationPresets,
        loadActiveCalibrationPreset,
        saveActiveCalibrationPresetId
    };
})();
