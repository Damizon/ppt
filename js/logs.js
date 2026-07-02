(function () {
    const calculator = window.ProdTimerCalculator;
    const storage = window.ProdTimerStorage;

    const elements = {};

    window.addEventListener('DOMContentLoaded', init);

    async function init() {
        cacheElements();
        await storage.init(calculator.DEFAULT_SETTINGS);
        bindEvents();
        renderStorageStatus();
        await renderLogs();
    }

    function cacheElements() {
        elements.storageStatus = document.getElementById('storageStatus');
        elements.connectStorageBtn = document.getElementById('connectStorageBtn');
        elements.disconnectStorageBtn = document.getElementById('disconnectStorageBtn');
        elements.logCount = document.getElementById('logCount');
        elements.latestLogTime = document.getElementById('latestLogTime');
        elements.allLogRows = document.getElementById('allLogRows');
    }

    function bindEvents() {
        elements.connectStorageBtn.addEventListener('click', connectSharedStorage);
        elements.disconnectStorageBtn.addEventListener('click', disconnectSharedStorage);
    }

    async function connectSharedStorage() {
        try {
            await storage.connectSharedFolder(calculator.DEFAULT_SETTINGS);
            renderStorageStatus();
            await renderLogs();
        } catch (error) {
            alert(error.message || 'Shared data folder connection failed.');
        }
    }

    async function disconnectSharedStorage() {
        await storage.disconnectSharedFolder();
        renderStorageStatus();
        await renderLogs();
    }

    function renderStorageStatus() {
        const status = storage.getStorageStatus();

        elements.storageStatus.innerText = status.sharedConnected ? 'Shared Data Folder' : 'Local Browser';
        elements.connectStorageBtn.disabled = !status.sharedSupported;
        elements.disconnectStorageBtn.disabled = !status.sharedConnected;
    }

    async function renderLogs() {
        const logs = await storage.loadAllHistory();
        const newestFirst = logs.slice().reverse();

        elements.logCount.innerText = logs.length.toString();
        elements.latestLogTime.innerText = newestFirst.length ? formatCreatedAt(newestFirst[0]) : '-';
        elements.allLogRows.innerHTML = '';

        newestFirst.forEach((entry) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${escapeHtml(formatCreatedAt(entry))}</td>
                             <td>${escapeHtml(entry.id || '-')}</td>
                             <td>${escapeHtml(formatMeasured(entry))}</td>
                             <td>${escapeHtml(entry.totalQty || '-')}</td>
                             <td>${escapeHtml(entry.mp || '-')}</td>
                             <td>${escapeHtml(entry.est || '-')}</td>`;
            elements.allLogRows.appendChild(row);
        });
    }

    function formatCreatedAt(entry) {
        if (entry.createdAt) {
            return new Date(entry.createdAt).toLocaleString('en-GB');
        }

        return entry.time || '-';
    }

    function formatMeasured(entry) {
        const qty = entry.testQty || '-';
        const duration = entry.duration || '-';
        return `${qty} pcs / ${duration}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
})();
