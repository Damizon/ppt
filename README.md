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
    |-- storage-file.js     # shared data folder persistence
    |-- storage-local.js    # localStorage persistence
    |-- storage-manager.js  # storage mode selection
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

Calibration presets are stored in the active storage mode.

You can:

- load the built-in `Default` preset,
- save a new preset,
- update an existing custom preset,
- delete a custom preset,
- set the active preset used by the main timer.

The active preset name is shown on the main timer page.

## Storage Notes

The app supports two storage modes:

- `Local Browser` - browser `localStorage`, used as the default fallback.
- `Shared Data Folder` - user-approved file storage through the File System Access API.

In local mode, data is stored under these browser keys:

- activity log: `genericProdLog`
- calibration presets: `prodTimerCalibrationPresets`
- active preset: `prodTimerActiveCalibrationPresetId`

Because the app runs as plain static HTML, the browser cannot silently write files next to `index.html`, even if the folder is writable through Samba. To write shared files, use `Connect Data Folder` and select the `data` folder.

## Shared Data Folder

The repository includes a reserved `data/` folder:

```text
data/
|-- README.md
|-- calibration-presets.json
|-- active-calibration.json
`-- production-log.txt
```

This folder is the shared storage location for production use. Each workstation should click `Connect Data Folder` and select the same `data` folder next to `index.html`.

Initial shared files:

- `data/calibration-presets.json` - default calibration preset seed.
- `data/active-calibration.json` - active shared preset pointer.
- `data/production-log.txt` - append-style production log file.

Browser support note: shared folder storage requires File System Access API support, which is available in Chromium-based browsers such as Chrome and Edge. If unsupported or disconnected, the app falls back to local browser storage.

## License

MIT License 2026.

Created by Damian Michalowski @Damizon.
