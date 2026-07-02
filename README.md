# Production Pro Timer

Production Pro Timer is a lightweight browser-based time study and production estimate tool. It measures a sample run, calculates ideal production time, and applies a configurable real-world allowance model for fatigue, handling, documentation, and production delays.

The app is designed to run as static files. You can open `index.html` directly from a local folder or from a shared network location such as Samba.

## Features

- Stopwatch-style production sample timer.
- Manual time entry using HH:MM:SS fields.
- Job reference normalization with `FRM` prefix.
- Ideal MP and total estimate calculation.
- Real production estimate using configurable factors.
- Calibration page with presets.
- Browser-local activity log for the last 5 saved entries.
- Separate methodology page explaining the allowance model.

## Project Structure

```text
.
|-- index.html              # Main timer app
|-- calibration.html        # Calibration and preset management
|-- methodology.html        # Technical model explanation
|-- css/
|   `-- styles.css
`-- js/
    |-- app.js              # Main app wiring and DOM updates
    |-- calculator.js       # Production estimate algorithm
    |-- calibration.js      # Calibration page logic
    |-- format.js           # Time formatting helpers
    |-- storage-local.js    # localStorage persistence
    `-- timer.js            # Timer state and elapsed time handling
```

## Running

Open `index.html` in a browser.

No build step, package manager, or server is required.

For shared use, place the whole folder on a network share and open:

```text
index.html
```

## Calibration

Open `calibration.html` or use the `Calibration` link from the main app.

Calibration controls:

- `Base Allowance` - fixed percentage added to every real estimate.
- `Max Factor` - maximum dynamic allowance inside the shift curve.
- `Ramp Curve` - controls how quickly the dynamic factor grows.
- `Batch Sensitivity` - controls how strongly sample size affects the dynamic factor.
- `Shift Hours` - length of one allowance cycle before the curve resets.

The `AUTO-FIT BASE` button uses a known calculated-vs-actual job result to set `Base Allowance`. For example:

```text
Calculated: 3.90 h
Actual:     5.05 h
Correction: +29.5%
```

## Calibration Presets

Calibration presets are stored in the browser using `localStorage`.

You can:

- load the built-in `Default` preset,
- save a new preset,
- update an existing custom preset,
- delete a custom preset,
- set the active preset used by the main timer.

The active preset name is shown on the main timer page.

## Storage Notes

Current storage is browser-local:

- activity log: `genericProdLog`
- calibration presets: `prodTimerCalibrationPresets`
- active preset: `prodTimerActiveCalibrationPresetId`

Because the app runs as plain static HTML, the browser cannot silently write files next to `index.html`, even if the folder is writable through Samba. A future version can add File System Access API support for user-approved shared-folder writes.

## License

MIT License 2026.

Created by Damian Michalowski @Damizon.
