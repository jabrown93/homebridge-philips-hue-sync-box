# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Homebridge plugin for the Philips Hue Sync Box. It exposes the Sync Box to Apple HomeKit as various accessory types (lightbulbs, switches, TVs) and provides an optional HTTP API for automation. The plugin is written in TypeScript and uses ES2022 modules.

## Development Commands

### Setup and Build

```bash
npm install                    # Install dependencies
npm run build                  # Compile TypeScript (src/ -> dist/)
npm run clean                  # Remove dist/ folder
npm link                       # Link plugin to global Homebridge
```

### Code Quality

```bash
npm run typecheck              # Type-check without emitting files
npm run lint                   # Lint TypeScript files
npm run lint:fix               # Lint and auto-fix issues
npm run prettier               # Check code formatting
npm run format                 # Format code with Prettier
```

### Development Workflow

```bash
npm run watch                  # Auto-compile and restart Homebridge on changes
                              # Uses test/hbConfig/ for config
                              # Runs: homebridge -U ./test/hbConfig -I -D
```

Before using `npm run watch`, ensure `test/hbConfig/config.json` exists. If not, copy from `test/hbConfig/config-template.json`.

### Release

```bash
npm run release                # Build and run semantic-release
```

## Architecture

### Plugin Entry Point

- `src/index.ts`: Registers the `HueSyncBoxPlatform` with Homebridge

### Core Platform

- `src/platform.ts`: Main `HueSyncBoxPlatform` class implementing `DynamicPlatformPlugin`
  - Discovers and creates accessories based on config
  - Manages accessory lifecycle (registration, restoration, removal)
  - Polls Sync Box state on interval (default 5 seconds)
  - Handles both regular platform accessories (lightbulb, switch) and external accessories (TVs)

### API Client

- `src/lib/client.ts`: `SyncBoxClient` class
  - Communicates with Philips Hue Sync Box HTTPS API
  - Uses async-lock to prevent concurrent requests
  - Includes retry logic (3 retries with exponential backoff)
  - Accepts self-signed certificates (rejectUnauthorized: false)
  - Methods: `getState()`, `updateExecution()`, `updateHue()`

### State Management

- `src/state.ts`: TypeScript interfaces for Sync Box API responses
  - `State`: Complete device state
  - `Execution`: Sync mode, brightness, HDMI source, intensity
  - `Hue`: Connected Hue bridge and entertainment groups
  - `Hdmi`: HDMI input/output information
  - `Device`: Device metadata and firmware info

### Accessories

All accessories extend `SyncBoxDevice` base class (`src/accessories/base.ts`):

- `src/accessories/lightbulb.ts`: Exposes as HomeKit lightbulb (on/off, brightness)
- `src/accessories/switch.ts`: Exposes as HomeKit switch (on/off only)
- `src/accessories/baseTv.ts`: Abstract base for TV accessories
  - `src/accessories/tv.ts`: HDMI input switching
  - `src/accessories/modeTv.ts`: Mode switching (video/music/game)
  - `src/accessories/intensityTv.ts`: Intensity switching (subtle/moderate/high/intense)
  - `src/accessories/entertainmentTv.ts`: Entertainment area switching

**TV Accessories:**

- Published as external accessories (must be manually added to HomeKit)
- Support iOS remote widget controls
- Can have integrated lightbulb service for brightness control
- Category can be configured (tv, settopbox, tvstick, audioreceiver)

### HTTP API Server

- `src/api-server.ts`: Optional HTTP API for automation
  - GET `/state`: Retrieve current Sync Box state
  - POST `/state`: Update Sync Box state
  - Requires Authorization header with configured token
  - Enabled via `apiServerEnabled` config (default: false, port: 40220)

### Configuration

- `src/config.ts`: TypeScript interface for plugin configuration
- `config.schema.json`: JSON schema for Homebridge Config UI

### Constants

- `src/lib/constants.ts`: Shared constants for accessory types and modes

## Key Concepts

### Multiple Sync Boxes

Each Sync Box instance requires a unique `uuidSeed` value. Changing this value causes accessories to be recreated (not recommended unless needed). Leave empty for a single Sync Box.

### Sync Box Modes

- **On modes**: `video`, `music`, `game`, `lastSyncMode` (configurable via `defaultOnMode`)
- **Off modes**: `passthrough`, `powersave` (configurable via `defaultOffMode`)

### State Polling

The platform polls the Sync Box every `updateIntervalInSeconds` (default: 5) to sync HomeKit state with device state. Updates are pushed to all registered accessories.

### Accessory UUID Generation

UUIDs are generated using `api.hap.uuid.generate(kind + uuidSeed)` where `kind` is the accessory type constant. This ensures stable UUIDs across restarts.

## Common Patterns

### Adding a New Accessory Type

1. Create new class extending `SyncBoxDevice` in `src/accessories/`
2. Implement required abstract methods (`getServiceType()`, `update()`)
3. Add constant for accessory type in `src/lib/constants.ts`
4. Add config options to `config.ts` and `config.schema.json`
5. Update `platform.ts`:
   - Add device creation in `discoverAccessories()`
   - Add case in `createDevice()` switch statement

### Updating Sync Box State

Use `this.platform.client.updateExecution()` or `this.platform.client.updateHue()` from accessories. The client handles locking, retries, and error logging.

### Handling Characteristic Changes

Override `handlePowerCharacteristicSet()` or add new characteristic handlers. Always check current value to avoid unnecessary API calls.

## Important Notes

- This is an **ES2022 module** project - use `.js` extensions in import statements
- The plugin uses **strict TypeScript** mode (except `noImplicitAny: false`)
- Sync Box API uses **self-signed certificates** - certificate validation is disabled
- API requests are **serialized** via async-lock to prevent conflicts
- TV accessories are **external** and require manual HomeKit pairing
- The platform uses **Homebridge's dynamic platform API** for accessory management
- Pre-commit hooks run linting and formatting via husky and lint-staged
