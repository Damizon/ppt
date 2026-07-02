# Shared Data Folder

This folder is reserved for shared Production Pro Timer data.

Every workstation should use the `Connect Data Folder` button in the app and select this exact `data` folder. In a Samba deployment, keep this folder next to `index.html` so users can easily find the correct location.

Expected files:

- `calibration-presets.json` - shared calibration presets.
- `active-calibration.json` - the preset selected for production use.
- `production-log.txt` - production log entries, one JSON object per line.

Do not rename this folder unless every workstation is updated to use the new location.
