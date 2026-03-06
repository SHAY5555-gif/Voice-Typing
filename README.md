# Voice Typing

Voice Typing is a Chrome extension for dictation and audio transcription using
the ElevenLabs Scribe API. It can record from your microphone, the current tab,
or desktop audio and insert the transcript into text fields.

## Features

- Dictate directly into input fields and contenteditable editors
- Record from microphone, current tab audio, or desktop audio
- Keep a short local transcription history
- Support English and Hebrew UI flows
- Run locally without a project backend

## Project Status

This repository is maintained as an open source Chrome extension. Secrets must
never be committed. Runtime API keys belong in local extension storage or a
local `.env` file that stays outside version control.

## Quick Start

1. Install dependencies with `npm ci`
2. Run project checks with `npm run check`
3. Open `chrome://extensions`
4. Enable `Developer mode`
5. Click `Load unpacked`
6. Select the repository root folder
7. Open the extension and add your ElevenLabs API key in Settings

## Development Commands

- `npm run lint` checks the JavaScript and Node scripts
- `npm run check` runs lint plus extension validation
- `npm run build` creates a zip package in `artifacts/`

## Repository Layout

- `manifest.json`: Chrome extension manifest
- `background.js`: service worker and extension actions
- `content.js`: text insertion logic for supported fields
- `popup.js`: popup and side panel logic
- `popup.html`, `popup_en.html`, `popup_he.html`: extension UI shells
- `microphone.html`, `microphone.js`: permission helper page
- `docs/index.html`: privacy policy page ready for GitHub Pages
- `scripts/`: repository validation and packaging scripts

## Permissions

The extension requests the following Chrome permissions:

- `storage`: save settings and local transcription history
- `microphone`: record microphone input
- `tabCapture`: capture audio from the active tab
- `desktopCapture`: capture system audio from screen share flow
- `sidePanel`: open the extension in Chrome side panel
- `tabs`: open the microphone permission helper tab when needed

Host access is limited to `https://api.elevenlabs.io/*` for transcription.

## Privacy

The privacy policy lives in [docs/index.html](docs/index.html). For Chrome Web
Store publishing, serve that file through GitHub Pages or another static host.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

To report a vulnerability, follow [SECURITY.md](SECURITY.md). Do not open a
public issue for sensitive security problems.

## License

This project is released under the [MIT License](LICENSE).
