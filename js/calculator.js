(function () {
    const DEFAULT_SETTINGS = {
        shiftHours: 9,
        maxFactor: 89
    };

    function calculateProductionEstimate(input, settings = DEFAULT_SETTINGS) {
        const testQty = Number.parseFloat(input.testQty) || 1;
        const totalQty = Number.parseFloat(input.totalQty) || 0;
        const seconds = Number(input.elapsedMs || 0) / 1000;

        if (seconds <= 0) {
            return null;
        }

        const idealMP = (seconds / testQty) / 60;
        const idealTotalHours = (idealMP * totalQty) / 60;
        const idealUnitSeconds = seconds / testQty;

        const shiftHours = settings.shiftHours;
        const maxFactor = settings.maxFactor;
        let factorPercent = 0;

        if (totalQty > testQty) {
            const ratio = (totalQty - testQty) / totalQty;
            let hoursInsideCurrentShift = idealTotalHours % shiftHours;

            if (hoursInsideCurrentShift === 0 && idealTotalHours > 0) {
                hoursInsideCurrentShift = shiftHours;
            }

            factorPercent = (hoursInsideCurrentShift / shiftHours) * maxFactor;
            factorPercent *= ratio;
            factorPercent = Math.min(factorPercent, maxFactor);
        }

        const realTotalHours = idealTotalHours * (1 + factorPercent / 100);
        const realMP = (realTotalHours * 60) / totalQty;
        const realUnitSeconds = (realTotalHours * 3600) / totalQty;

        return {
            ideal: {
                mp: idealMP,
                unitSeconds: idealUnitSeconds,
                totalHours: idealTotalHours
            },
            factor: {
                percent: factorPercent
            },
            real: {
                mp: realMP,
                unitSeconds: realUnitSeconds,
                totalHours: realTotalHours
            }
        };
    }

    window.ProdTimerCalculator = {
        DEFAULT_SETTINGS,
        calculateProductionEstimate
    };
})();
