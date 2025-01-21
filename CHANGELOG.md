# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.5](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.4...v1.1.5) (2025-01-21)

### Bug Fixes

* Removes non functional "Base Accessory Name" config, Homebridge cannot sync this to HomeKit ([#110](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/110)) ([25deadc](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/25deadc5ef3f632d7e96074fc7646cd20d1ddd98))

## [1.1.4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.3...v1.1.4) (2025-01-20)

### Bug Fixes

* handle powersave mode and offline sync box ([1b0370a](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/1b0370ada4ac6abbf732791b06a22485ad850e3a))

## [1.1.3](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.2...v1.1.3) (2025-01-20)

### Bug Fixes

* Mode changes handle passthrough state properly ([0c6b6e0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/0c6b6e06c3d5f6458e306549fe7bbaaa3e01426a))
* Prevent HomeKit from showing the wrong state due to update race condition ([2dc1155](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/2dc11552a14e6c0e3117758674aa92819eb62e43))
* Use last sync mode for intensity udpates when in passthrough or power save ([3f30654](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/3f306540b082a065d1299c7374f52bfb5b874e28))

## [1.1.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.1...v1.1.2) (2025-01-20)

### Bug Fixes

* Config UI now sets Intensity TV name properly, name may need to be readded to config ([11c7181](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/11c71817ce7d25866c3e44221ef814e1571fddaf))
* prevent misleading logs about configured names on startup ([bc4b6bc](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/bc4b6bc7e12c6bc63dc91ffadc7ae91f8ece5fa5))

## [1.1.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.0...v1.1.1) (2025-01-20)

### Bug Fixes

* TV Accessories stay on when off mode is set to passthrough ([bb36f91](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/bb36f91c4ae7f70d474c0846cc57494124fd2ac1))

## [1.1.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.8...v1.1.0) (2025-01-20)

### Features

* Adds ability to set accessory names in Homebridge, overrides HomeKit ([dc44485](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/dc44485d19a2ffe573b6a743d9c649651345a7f7))

## [1.0.8](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.7...v1.0.8) (2025-01-19)

### Bug Fixes

* Default values for the UI config editor are now cased properly ([dfd1777](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/dfd1777e2fe88613dca8bdfafe30a115bc323a38))
* Invalid base accessory values now default to None to match config UI ([4ea50be](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/4ea50be8d40e36442188fac2896f77fac91d85d7))

## [1.0.7](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.6...v1.0.7) (2025-01-19)

### Performance Improvements

* perform async update calls to sync box ([#90](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/90)) ([#97](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/97)) ([8986e32](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/8986e32c449e922c84ad2c9f3eec4ff5e12f949c))

## [1.0.6](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.5...v1.0.6) (2025-01-19)

### Bug Fixes

* Intense mode shows up. Inputs are Capitalized. LightBulbAccessoy is properly cased ([#95](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/95)) ([bc225bd](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/bc225bdc9fab25ba2817eee113219f6d918f3af3))

## [1.0.5](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.4...v1.0.5) (2025-01-19)

### Bug Fixes

* Update UUID seed for TV Accessories to match <1.0.0 ([#75](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/75)) ([#86](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/86)) ([#94](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/94)) ([afe96ed](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/afe96ed344f9e6e1f72f6d608a6785e5030294b7))

## [1.0.4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.3...v1.0.4) (2025-01-18)

### Bug Fixes

* set ConfiguredName for TV accessories to prevent "Sync Box" name ([#91](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/91)) ([#92](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/92)) ([8eb523c](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/8eb523c3d073eba591fce5be3a0d4b7138a80ddc))

## [1.0.3](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.2...v1.0.3) (2025-01-17)

### Bug Fixes

* use ES2022 module instead of commonjs to work with Node 18 and 20 ([#89](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/89)) ([d29bee6](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/d29bee65b08ad83c784d41e1460ecbc4dac057d0))

## [1.0.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.1...v1.0.2) (2025-01-14)

### Bug Fixes

* Ensure each config always has a default ([247a4da](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/247a4da867c0af525d64b90c456d6c11636b97e8))
* Mode TV now updates mode correctly from Hue State ([028b49c](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/028b49ccd7cc6a54e788ef7cf8397faa0432d0db))
* retry failed requests and better error handling ([146fcd9](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/146fcd9c2dbb22954bd3fcd7e175c2630f3bd39e))
* use proper power characteristic when updating ([8e5b254](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/8e5b25495abcfc2325ecf6a4f86cb62b14d7b46c))

## [1.0.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.0.0...v1.0.1) (2025-01-14)

### Bug Fixes

* add keep-alive to HTTP requests ([#77](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/77)) ([f344c44](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/f344c441dcd000bf56eb12cfd9d88b71a586236c))
* ensure updateIntervalInSeconds always defaults to 5 ([7f367a6](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/7f367a67bc57f99f79bfd193156f5ae8134ac892))
* set active identifier correctly from lookup map ([583187f](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/583187f9964c0a32f3343a80fe2e4b8cfd11154f))
