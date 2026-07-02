(function () {
    function createTimer(options) {
        let startTime;
        let elapsedTime = 0;
        let timerInterval;
        let running = false;

        function notifyChange() {
            options.onChange({
                elapsedTime,
                running
            });
        }

        function toggle() {
            if (!running) {
                startTime = Date.now() - elapsedTime;
                timerInterval = setInterval(update, 100);
                running = true;
            } else {
                clearInterval(timerInterval);
                running = false;
            }

            notifyChange();
        }

        function update() {
            elapsedTime = Date.now() - startTime;
            notifyChange();
        }

        function setElapsedFromParts(hours, minutes, seconds) {
            elapsedTime = (hours * 3600 + minutes * 60 + seconds) * 1000;

            if (running) {
                startTime = Date.now() - elapsedTime;
            }

            notifyChange();
        }

        function reset() {
            clearInterval(timerInterval);
            elapsedTime = 0;
            running = false;
            notifyChange();
        }

        function getState() {
            return {
                elapsedTime,
                running
            };
        }

        return {
            toggle,
            setElapsedFromParts,
            reset,
            getState
        };
    }

    window.ProdTimerTimer = {
        createTimer
    };
})();
