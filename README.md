[![OpenCode][opencode-shield]][opencode-npm]
[![OpenChamber][openchamber-shield]][openchamber-npm]
[![Add-on Version][version-shield]][github]
[![Build][build-shield]][build-workflow]
[![License][license-shield]][license]

# OpenCode-OpenChamber

**AI coding agent & visual workspace for Home Assistant**

This add-on bundles [OpenCode](https://opencode.ai) — an AI coding agent — with [OpenChamber](https://github.com/openchamber) — a rich web UI — into a single Home Assistant add-on. Edit configuration, create automations, and manage your smart home using natural language, with optional visual workspace engineering via OpenChamber.

[Installation](#installation) · [Features](#features) · [Updating](#-automatic-updates) · [Documentation][docs] · [Support](#support)

---

## Installation

1. **Add the repository:**

   [![Add Repository][repo-btn]][repo-add]

   Or add manually: **Settings → Add-ons → Add-on Store → ⋮ → Repositories** and enter:

   ```
   https://github.com/Rahulsharma0810/homeassistant-opencode-openchamber
   ```

2. **Install:** Find **OpenCode-OpenChamber** in the store and click **Install**.

3. **Start:** Open the sidebar panel or click **Open Web UI**, run `opencode`, then use `/connect` to configure an AI provider.

---

## Features

- **AI-Powered Editing** — Modify any HA config file using natural language
- **Rich Web Terminal** — 10 themes, clipboard support, touch scrolling
- **OpenChamber Web UI** — Optional visual workspace with diff viewer, chat timeline, session sync
- **34 MCP Tools** — Deep Home Assistant integration (entities, services, config validation, screenshots)
- **YAML LSP** — Entity autocomplete, hover docs, deprecation warnings, go-to-definition
- **Safe Config Writing** — Multi-layer validation pipeline with automatic backup/restore
- **hab CLI** — Manage dashboards, areas, helpers, backups, automations via API
- **Zigbee Toolkit** — zigporter CLI for device migration, mesh mapping, cascade-rename
- **75+ AI Providers** — Anthropic, OpenAI, Google, Ollama, Groq, and more
- **PPQ Private TEE Models (Beta)** — Encrypted proxy for remote TEE-backed models

---

## 🚀 Automatic Updates

This add-on is rebuilt **daily** to track the latest upstream releases:

| Component | Source | Update Frequency |
|-----------|--------|-----------------|
| **OpenCode** (`opencode-ai`) | [NPM][opencode-npm] | On add-on start (via `latest` update policy) |
| **OpenChamber** (`@openchamber/web`) | [NPM][openchamber-npm] | Daily via automated Docker build |
| **hab CLI** | [GitHub](https://github.com/balloob/home-assistant-build-cli) | Built from source at image build time |

The automated CI pipeline checks for new NPM releases daily at **04:00 UTC**, updates the add-on version metadata, builds multi-architecture Docker images (`amd64` + `aarch64`), and publishes them to the GitHub Container Registry. A new add-on update will appear in your Home Assistant UI automatically when a newer image is published.

Current tracked versions:
- **OpenCode:** [![opencode-ai][opencode-shield]][opencode-npm]
- **OpenChamber:** [![@openchamber/web][openchamber-shield]][openchamber-npm]

---

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| Enable MCP Integration | `true` | Home Assistant Model Context Protocol server |
| Enable LSP Integration | `true` | YAML Language Server Protocol support |
| CPU Mode | `auto` | Auto-detect, baseline (no AVX2), or regular |
| OpenCode Update Policy | `latest` | Track upstream releases at each startup |
| Enable OpenChamber | `false` | Start the OpenChamber web UI |
| OpenChamber Port | `3010` | Web UI listen port |
| Enable Screenshot Tool | `false` | Headless Chromium for visual verification |
| Enable PPQ Private (Beta) | `false` | TEE-backed encrypted proxy |
| Enable LAN Server | `false` | Remote `opencode attach` access |
| Serial Devices | `[]` | Host UART devices to map into the container |
| Environment Variables | `[]` | Custom env vars for providers/credentials |

---

## Documentation

- [**Full Add-on Guide**][docs] — All features, MCP tools, LSP, safe config writing, OpenChamber
- [**Changelog**][changelog] — Version history with per-component tracking
- [OpenCode Docs](https://opencode.ai/docs) — AI agent documentation
- [OpenChamber Docs](https://github.com/openchamber) — Web UI documentation

---

## Support

- [OpenCode Discord](https://opencode.ai/discord) — Community
- [GitHub Issues][issues] — Bug reports & feature requests

---

## License

This add-on is released into the public domain under the [Unlicense](UNLICENSE).

<!-- Links -->
[docs]: ./ha_opencode/DOCS.md
[changelog]: ./ha_opencode/CHANGELOG.md
[issues]: https://github.com/Rahulsharma0810/homeassistant-opencode-openchamber/issues
[license]: UNLICENSE
[github]: https://github.com/Rahulsharma0810/homeassistant-opencode-openchamber
[repo-add]: https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FRahulsharma0810%2Fhomeassistant-opencode-openchamber
[repo-btn]: https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg
[opencode-npm]: https://www.npmjs.com/package/opencode-ai
[openchamber-npm]: https://www.npmjs.com/package/@openchamber/web

<!-- Badges -->
[version-shield]: https://img.shields.io/badge/addon-v1.17.12--1.13.8.1-blue.svg
[opencode-shield]: https://img.shields.io/badge/opencode--ai-v1.17.12-blue.svg
[openchamber-shield]: https://img.shields.io/badge/@openchamber/web-v1.13.8-blue.svg
[build-shield]: https://img.shields.io/github/actions/workflow/status/Rahulsharma0810/homeassistant-opencode-openchamber/build.yaml?style=flat-square&label=build
[build-workflow]: https://github.com/Rahulsharma0810/homeassistant-opencode-openchamber/actions/workflows/build.yaml
[license-shield]: https://img.shields.io/github/license/Rahulsharma0810/homeassistant-opencode-openchamber.svg?style=flat-square
