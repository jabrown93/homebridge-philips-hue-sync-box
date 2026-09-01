<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>

<h1 align="center">Homebridge Philips Hue Sync Box</h1>

<p align="center">Bring your Philips Hue Sync Box into Apple HomeKit.</p>

<p align="center">

[![npm version](https://badgen.net/npm/v/homebridge-philips-hue-sync-box?color=purple&icon=npm&label)](https://www.npmjs.com/package/homebridge-philips-hue-sync-box)
[![npm beta version](https://badgen.net/npm/v/homebridge-philips-hue-sync-box/beta?color=purple&icon=npm&label=beta)](https://www.npmjs.com/package/homebridge-philips-hue-sync-box)
[![npm downloads](https://badgen.net/npm/dw/homebridge-philips-hue-sync-box?color=purple&icon=npm&label)](https://www.npmjs.com/package/homebridge-philips-hue-sync-box)
[![GitHub Stars](https://badgen.net/github/stars/jabrown93/homebridge-philips-hue-sync-box?color=cyan&icon=github)](https://github.com/jabrown93/homebridge-philips-hue-sync-box)
[![Build](https://img.shields.io/github/actions/workflow/status/jabrown93/homebridge-philips-hue-sync-box/build.yaml?label=build)](https://github.com/jabrown93/homebridge-philips-hue-sync-box/actions/workflows/build.yaml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/jabrown93/homebridge-philips-hue-sync-box/codeql.yaml?label=CodeQL)](https://github.com/jabrown93/homebridge-philips-hue-sync-box/actions/workflows/codeql.yaml)
[![Release](https://img.shields.io/github/v/release/jabrown93/homebridge-philips-hue-sync-box)](https://github.com/jabrown93/homebridge-philips-hue-sync-box/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

</p>

A [Homebridge](https://homebridge.io) plugin that exposes the [Philips Hue Sync Box](https://www.philips-hue.com/en-us/p/hue-play-hdmi-sync-box/8719514440996) to Apple HomeKit, so you can turn syncing on/off, switch inputs, change modes, and automate it alongside the rest of your smart home.

## Features

- **Base accessory** — expose the Sync Box as a lightbulb (on/off + brightness) or a plain switch (on/off).
- **Power switch** — an optional, separate switch that toggles the box between passthrough and powersave.
- **TV accessories** (opt-in, one per behavior) — each appears in the Apple TV remote widget and iOS Control Center:
  - **HDMI TV** — switch inputs.
  - **Mode TV** — switch between `video`, `music`, and `game`.
  - **Intensity TV** — switch between `subtle`, `moderate`, `high`, and `intense`.
  - **Entertainment TV** — switch the active Hue entertainment area.
  - Each TV accessory optionally exposes its own integrated lightbulb for brightness control.
- **HTTP API** — an optional local API for scripting and HomeKit Shortcuts automations.
- **Multiple Sync Boxes** — run one plugin instance per box, each with its own accessories.

> [!IMPORTANT]
> TV accessories are published as _external_ accessories and must be added to HomeKit manually — Homebridge logs the pairing PIN (the same one used for the main bridge).

## Table of Contents

- [Installation](#installation)
  - [Requirements](#requirements)
  - [Install the Plugin](#install-the-plugin)
  - [Get a Sync Box Access Token](#get-a-sync-box-access-token)
  - [Running Multiple Sync Boxes](#running-multiple-sync-boxes)
- [Configuration](#configuration)
- [HTTP API](#http-api)
  - [GET /state](#get-state)
  - [POST /state](#post-state)
- [Development](#development)
- [Getting Help](#getting-help)
- [Acknowledgments](#acknowledgments)

## Installation

### Requirements

- Homebridge `^1.8.0` or `^2.0.0-beta.0` — **Homebridge 1.x support is deprecated and will be removed in a future major release; please upgrade to Homebridge 2.x**
- Node.js `^22.12.0` or `^24.11.0`
- A Philips Hue Sync Box on the same network as Homebridge

### Install the Plugin

**Using Homebridge UI (recommended)**

1. Open the [Homebridge UI](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-macOS#complete-login-to-the-homebridge-ui).
2. Go to the **Plugins** tab, search for `homebridge-philips-hue-sync-box`, and install it.
3. Get a Sync Box access token as described [below](#get-a-sync-box-access-token).
4. Configure the plugin from the Homebridge Config UI.

**Manual**

1. Install with `hb-service add homebridge-philips-hue-sync-box`, or `npm i -g homebridge-philips-hue-sync-box` if you're not using `hb-service`.
2. Get a Sync Box access token as described [below](#get-a-sync-box-access-token).
3. Add the platform to Homebridge's `config.json`, see [Configuration](#configuration).

### Get a Sync Box Access Token

The plugin authenticates with the Sync Box using a token you generate once via its local API:

1. Make sure the Sync Box is powered on and synchronization is stopped.
2. Send an HTTP `POST` to `https://<SYNC-BOX-IP>/api/v1/registrations` with a JSON body of `{ "appName": "homebridge", "instanceName": "homebridge" }`.
3. The first response will be `{ "code": 16, "message": "Invalid State" }` — this is expected.
4. Within 5 seconds, press and hold the button on the Sync Box until the LED turns green, then release it immediately. It will switch back to white.
5. Within 5 seconds of the LED turning green, send the exact same `POST` request again.
6. The response now contains an `accessToken` string — save it for your plugin configuration.

One way to do this from a terminal:

```shell
curl -k -H "Content-Type: application/json" \
  -X POST -d '{"appName": "homebridge", "instanceName": "homebridge"}' \
  https://<SYNC-BOX-IP>/api/v1/registrations
```

You can also use a tool like [Postman](https://www.postman.com/): set the method to `POST`, the URL to `https://<SYNC-BOX-IP>/api/v1/registrations`, and the body to raw JSON containing `{ "appName": "homebridge", "instanceName": "homebridge" }`. If you hit a certificate error, disable SSL certificate verification in Postman's settings.

Once you have a token, you can validate it with:

```shell
curl -k -H "Authorization: Bearer <ACCESS-TOKEN>" https://<SYNC-BOX-IP>/api/v1/
```

See the [official Hue Sync Box API documentation](https://developers.meethue.com/develop/hue-entertainment/hue-hdmi-sync-box-api/#Getting%20Started) for more detail (a free developer account is required).

> [!NOTE]
> This plugin has no control over how the Sync Box issues or validates tokens. Please don't open issues about "Invalid Token" errors — they will be closed without action.

### Running Multiple Sync Boxes

Each Sync Box needs its own plugin instance, added as a separate entry under `platforms` in `config.json`, each with a unique `uuidSeed`:

```json5
{
  // rest of config
  platforms: [
    {
      platform: 'PhilipsHueSyncBoxPlatform',
      name: 'LivingRoomPhilipsHueSyncBoxPlatform',
      syncBoxIpAddress: '<SYNC-BOX-1-IP-ADDRESS>',
      syncBoxApiAccessToken: '<SYNC-BOX-1-ACCESS-TOKEN>',
      uuidSeed: 'LivingRoom',
      // rest of config
    },
    {
      platform: 'PhilipsHueSyncBoxPlatform',
      name: 'BedroomPhilipsHueSyncBoxPlatform',
      syncBoxIpAddress: '<SYNC-BOX-2-IP-ADDRESS>',
      syncBoxApiAccessToken: '<SYNC-BOX-2-ACCESS-TOKEN>',
      uuidSeed: 'Bedroom',
      // rest of config
    },
  ],
}
```

- `uuidSeed` must be unique per Sync Box; it may be left empty (`""`) for at most one instance.
- `name` should also be unique per instance — it makes the logs easier to follow.

> [!WARNING]
> Changing `uuidSeed` on an existing setup removes and recreates every accessory for that instance. HomeKit treats them as brand new, so you'll need to re-add them (including any automations or room assignments). Only set it if you're running more than one Sync Box.

## Configuration

| Name                                     | Description                                                                                                                                                                                                                         | Type    | Default       | Required | Allowed Values                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------- | -------- | --------------------------------------------- |
| `syncBoxIpAddress`                       | IP address of your Philips Hue Sync Box.                                                                                                                                                                                            | string  |               | Yes      |                                               |
| `syncBoxApiAccessToken`                  | Access token obtained during [registration](#get-a-sync-box-access-token).                                                                                                                                                          | string  |               | Yes      |                                               |
| `defaultOnMode`                          | Mode used when switching the Sync Box on via HomeKit.                                                                                                                                                                               | string  | `video`       | No       | `video`, `music`, `game`, `lastSyncMode`      |
| `defaultOffMode`                         | Mode used when switching the Sync Box off via HomeKit.                                                                                                                                                                              | string  | `passthrough` | No       | `powersave`, `passthrough`                    |
| `baseAccessory`                          | Type of the primary Sync Box accessory. `none` exposes no base accessory.                                                                                                                                                           | string  | `lightbulb`   | No       | `lightbulb`, `switch`, `none`                 |
| `powerSwitchAccessory`                   | Adds a separate switch that toggles passthrough (on) vs. powersave (off), independent of `baseAccessory`.                                                                                                                           | boolean | `false`       | No       |                                               |
| `tvAccessory`                            | Enables a TV accessory for switching HDMI inputs.                                                                                                                                                                                   | boolean | `false`       | No       |                                               |
| `tvAccessoryConfiguredName`              | Custom name for the HDMI TV accessory.                                                                                                                                                                                              | string  |               | No       |                                               |
| `tvAccessoryType`                        | Icon shown for the HDMI TV accessory in the Home app.                                                                                                                                                                               | string  | `tv`          | No       | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `tvAccessoryLightbulb`                   | Adds an integrated lightbulb to the HDMI TV accessory.                                                                                                                                                                              | boolean | `false`       | No       |                                               |
| `modeTvAccessory`                        | Enables a TV accessory for switching modes (`video`, `music`, `game`).                                                                                                                                                              | boolean | `false`       | No       |                                               |
| `modeTvAccessoryConfiguredName`          | Custom name for the Mode TV accessory.                                                                                                                                                                                              | string  |               | No       |                                               |
| `modeTvAccessoryType`                    | Icon shown for the Mode TV accessory in the Home app.                                                                                                                                                                               | string  | `tv`          | No       | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `modeTvAccessoryLightbulb`               | Adds an integrated lightbulb to the Mode TV accessory.                                                                                                                                                                              | boolean | `false`       | No       |                                               |
| `intensityTvAccessory`                   | Enables a TV accessory for switching intensity (`subtle`, `moderate`, `high`, `intense`).                                                                                                                                           | boolean | `false`       | No       |                                               |
| `intensityTvAccessoryConfiguredName`     | Custom name for the Intensity TV accessory.                                                                                                                                                                                         | string  |               | No       |                                               |
| `intensityTvAccessoryType`               | Icon shown for the Intensity TV accessory in the Home app.                                                                                                                                                                          | string  | `tv`          | No       | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `intensityTvAccessoryLightbulb`          | Adds an integrated lightbulb to the Intensity TV accessory.                                                                                                                                                                         | boolean | `false`       | No       |                                               |
| `entertainmentTvAccessory`               | Enables a TV accessory for switching the active Hue entertainment area.                                                                                                                                                             | boolean | `false`       | No       |                                               |
| `entertainmentTvAccessoryConfiguredName` | Custom name for the Entertainment TV accessory.                                                                                                                                                                                     | string  |               | No       |                                               |
| `entertainmentTvAccessoryType`           | Icon shown for the Entertainment TV accessory in the Home app.                                                                                                                                                                      | string  | `tv`          | No       | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `entertainmentTvAccessoryLightbulb`      | Adds an integrated lightbulb to the Entertainment TV accessory.                                                                                                                                                                     | boolean | `false`       | No       |                                               |
| `treatPassthroughAsOffForTv`             | When enabled, TV accessories show as off in passthrough mode instead of on.                                                                                                                                                         | boolean | `false`       | No       |                                               |
| `updateIntervalInSeconds`                | Polling interval, in seconds, for reading Sync Box state.                                                                                                                                                                           | integer | `5`           | No       |                                               |
| `uuidSeed`                               | Unique identifier for this instance when running [multiple Sync Boxes](#running-multiple-sync-boxes). Leave empty for a single Sync Box.                                                                                            | string  |               | No       |                                               |
| `apiServerEnabled`                       | Enables the [HTTP API](#http-api).                                                                                                                                                                                                  | boolean | `false`       | No       |                                               |
| `apiServerPort`                          | Port the HTTP API listens on. Change this if the port is already in use.                                                                                                                                                            | integer | `40220`       | No       |                                               |
| `apiServerHost`                          | Address the HTTP API binds to. Defaults to localhost because the API sends its token over plaintext HTTP. Set to `0.0.0.0` to accept requests from other hosts, ideally behind a TLS reverse proxy.                                 | string  | `127.0.0.1`   | No       |                                               |
| `apiServerTlsCertPath`                   | Path to a PEM certificate. Set together with `apiServerTlsKeyPath` to serve the API over HTTPS instead of plaintext HTTP. Set both or neither.                                                                                      | string  |               | No       |                                               |
| `apiServerTlsKeyPath`                    | Path to the PEM private key matching `apiServerTlsCertPath`. Set both or neither.                                                                                                                                                   | string  |               | No       |                                               |
| `apiServerToken`                         | Token required in the `Authorization` header of every API request. Must be at least 32 characters long. Generate one with e.g. `openssl rand -hex 32` &mdash; do not reuse the example value below. Required if the API is enabled. | string  |               | No       |                                               |

<details>
<summary>Full example config.json</summary>

```json
{
  "platforms": [
    {
      "platform": "PhilipsHueSyncBoxPlatform",
      "syncBoxIpAddress": "<SYNC-BOX-IP-ADDRESS>",
      "syncBoxApiAccessToken": "<ACCESS-TOKEN>",
      "defaultOnMode": "video",
      "defaultOffMode": "passthrough",
      "baseAccessory": "lightbulb",
      "powerSwitchAccessory": false,
      "tvAccessory": false,
      "tvAccessoryConfiguredName": "Sync Box Input",
      "tvAccessoryType": "tv",
      "tvAccessoryLightbulb": false,
      "modeTvAccessory": false,
      "modeTvAccessoryConfiguredName": "Sync Box Mode",
      "modeTvAccessoryType": "tv",
      "modeTvAccessoryLightbulb": false,
      "intensityTvAccessory": false,
      "intensityTvAccessoryConfiguredName": "Sync Box Intensity",
      "intensityTvAccessoryType": "tv",
      "intensityTvAccessoryLightbulb": false,
      "entertainmentTvAccessory": false,
      "entertainmentTvAccessoryConfiguredName": "Sync Box Area",
      "entertainmentTvAccessoryType": "tv",
      "entertainmentTvAccessoryLightbulb": false,
      "treatPassthroughAsOffForTv": false,
      "updateIntervalInSeconds": 5,
      "uuidSeed": "livingroom",
      "apiServerEnabled": false,
      "apiServerPort": 40220,
      "apiServerHost": "127.0.0.1",
      "apiServerToken": "<A-LONG-RANDOM-SECRET-AT-LEAST-32-CHARS>"
    }
  ]
}
```

</details>

Each TV accessory also supports the iOS remote widget:

| Remote control  | Action            |
| --------------- | ----------------- |
| Up / Down       | Change brightness |
| Left / Right    | Change intensity  |
| Select (center) | Toggle mode       |
| Info button     | Toggle HDMI input |
| Play / Pause    | Toggle on/off     |

## HTTP API

When `apiServerEnabled` is `true`, the plugin exposes a small local HTTP API for automating the Sync Box outside of HomeKit — handy for HomeKit Shortcuts, which can call arbitrary HTTP endpoints from an automation.

```
http://<apiServerHost>:<apiServerPort>
```

The API binds to `127.0.0.1` by default, so it is reachable only from the Homebridge host. Because the token is sent over plaintext HTTP, set `apiServerHost` to `0.0.0.0` only when you need remote access. For remote access, serve HTTPS directly by setting `apiServerTlsCertPath` and `apiServerTlsKeyPath` to a PEM certificate and key, or put a TLS reverse proxy in front of it.

Every request must include the configured token in the `Authorization` header:

```
Authorization: <YOUR-TOKEN>
```

### GET /state

Returns the current state of the Sync Box as JSON:

```json
{
  "hue": {
    "bridgeUniqueId": "ID1",
    "bridgeIpAddress": "192.168.1.2",
    "groupId": "1",
    "groups": {
      "1": {
        "name": "Living Room TV area",
        "numLights": 1,
        "active": true,
        "owner": "HueSyncBox (ID2)"
      },
      "2": {
        "name": "Bedroom TV area",
        "numLights": 2,
        "active": false
      }
    },
    "connectionState": "streaming"
  },
  "execution": {
    "mode": "video",
    "syncActive": true,
    "hdmiActive": true,
    "hdmiSource": "input4",
    "hueTarget": "1",
    "brightness": 200,
    "lastSyncMode": "video",
    "video": {
      "intensity": "moderate",
      "backgroundLighting": true
    },
    "game": {
      "intensity": "intense",
      "backgroundLighting": false
    },
    "music": {
      "intensity": "high",
      "palette": "melancholicEnergetic"
    },
    "preset": null
  }
}
```

### POST /state

Sets Sync Box state. The body accepts any subset of the following:

```json5
{
  hue: {
    bridgeUniqueId: 'ID1',
    bridgeIpAddress: '192.168.1.2',
    groupId: '1',
    groups: {
      '12345678-be8e-4866-adce-ff3800aca123': {
        name: 'Living Room TV area',
        numLights: 1,
        active: true,
        owner: 'HueSyncBox (ID2)',
      },
      '56169ef5-be8e-4866-adce-ff3800aca35e': {
        name: 'Bedroom TV area',
        numLights: 2,
        active: false,
      },
    },
    connectionState: 'streaming',
  },
  execution: {
    mode: 'video',
    syncActive: true,
    hdmiActive: true,
    hdmiSource: 'input4',
    // hueTarget must be a valid ID from hue.groups. Any other value causes an error.
    hueTarget: '12345678-be8e-4866-adce-ff3800aca123',
    brightness: 200,
    lastSyncMode: 'video',
    video: {
      intensity: 'moderate',
      backgroundLighting: true,
    },
    game: {
      intensity: 'intense',
      backgroundLighting: false,
    },
    music: {
      intensity: 'high',
      palette: 'melancholicEnergetic',
    },
    preset: null,
  },
}
```

## Development

This plugin is written in TypeScript and targets ES2022 modules. See [`CLAUDE.md`](./CLAUDE.md) for a deeper architecture overview.

```shell
npm install                    # install dependencies
npm run build                  # compile src/ -> dist/
npm link                       # link the plugin to your global Homebridge install
npm run watch                  # rebuild and restart Homebridge on changes
npm test                       # run the unit test suite
```

`npm run watch` runs `homebridge -U ./test/hbConfig -I -D` against the sample config in [`test/hbConfig`](./test/hbConfig). Before running it for the first time, copy `test/hbConfig/config-template.json` to `test/hbConfig/config.json` and fill in your Sync Box details (the `setup-config` script does this automatically if the file doesn't exist yet).

Other useful checks:

```shell
npm run typecheck              # type-check without emitting files
npm run lint                   # lint TypeScript sources
npm run format                 # format with Prettier
```

## Getting Help

- Check the [Homebridge basic troubleshooting guide](https://github.com/homebridge/homebridge/wiki/Basic-Troubleshooting).
- Still stuck? Open an [issue](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/new/choose) with as much detail as the template asks for.
- Have a feature idea? Open a [feature request](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/new?template=feature-request.md).
- Want to contribute code or docs? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Acknowledgments

This plugin was originally developed by [Lukas Rögner](https://github.com/lukasroegner).
