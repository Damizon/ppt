(function () {
    const STORAGE_KEY = 'genericProdLog';
    const HISTORY_LIMIT = 5;

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

    window.ProdTimerStorage = {
        loadHistory,
        saveHistory,
        addHistoryEntry
    };
})();
