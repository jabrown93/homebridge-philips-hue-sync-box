# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.2.0-beta.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.1.2...v3.2.0-beta.1) (2026-09-01)

### Features

* surface Sync Box failures instead of reporting success ([#473](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/473)) ([440a62f](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/440a62fc922cc22eb7839a69c871a4bb1661421c))

## [3.1.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.1.1...v3.1.2) (2026-08-28)

### Bug Fixes

* **security:** pin Sync Box TLS to Philips's Sync Box CA ([#436](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/436)) ([fd8c52f](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/fd8c52fd3b8627eeb894725f4ed1cb0124ba222f))
* **client:** retry Sync Box request timeouts instead of failing the poll ([#461](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/461)) ([3893a32](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/3893a32a61ec90f4487d7cc13fa87dd240b8b29a)), closes [#458](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/458)

## [3.1.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.1.0...v3.1.1) (2026-08-10)

## [3.1.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.7...v3.1.0) (2026-07-18)

### Features

* **engines:** standardize Node engines, CI triggers, and deprecate Homebridge 1.x ([#444](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/444)) ([5fd3527](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/5fd352750153070c197932e7865cc80221ff7753))

## [3.0.7](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.6...v3.0.7) (2026-07-17)

### Bug Fixes

* **release:** build in prepack instead of gating publish on checks ([#441](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/441)) ([5043612](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/50436123c5c46277c1184102dc89a0b4e957fdb1)), closes [jabrown93/.github#24](https://github.com/jabrown93/.github/issues/24)

## [3.0.6](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.5...v3.0.6) (2026-07-17)

### Bug Fixes

* **release:** restore changelog bodies by pinning conventionalcommits to v9 ([#440](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/440)) ([a433e74](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/a433e748dceb4bf19356e07084ab6b9950e8d8ad)), closes [#438](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/438) [#418](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/418) [#439](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/439)

## [3.0.5](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.4...v3.0.5) (2026-07-17)

### Bug Fixes

* **release:** correct branches config typo, backfill missing changelog bodies ([#438](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/438)) ([3fb7eb4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/3fb7eb4ee67f2081db6b9e169d88bf8fb5feebd0))

## [3.0.4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.3...v3.0.4) (2026-07-17)

### Bug Fixes

* **client:** bound Sync Box requests and stop polling overlap ([#435](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/435)) ([aa22562](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/aa22562b0a74e3993c5a981206d7b5b5e0fb26f6)), closes [#431](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/431)
* **security:** prevent process-wide crashes from api-server and Sync Box response handling ([#434](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/434)) ([c48e4da](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/c48e4da50f1332d9d5d669646f992c2dad54575b))

## [3.0.3](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.2...v3.0.3) (2026-07-16)

### Bug Fixes

* **security:** close API server DoS, secret-leak, and validation gaps ([#429](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/429)) ([735f4bc](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/735f4bc521756459706889e8db3520bc66093f39))

## [3.0.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.1...v3.0.2) (2026-06-30)

### Bug Fixes

* rename issue chooser config to config.yml ([#421](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/421)) ([9145feb](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/9145febe00990cea136d26c3e1b97572ff244f91))

## [3.0.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v3.0.0...v3.0.1) (2026-06-17)

### Bug Fixes

* **dt-sbom:** read DT CI key from renamed OpenBao path ([#407](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/407)) ([31fed52](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/31fed521eae08366eba36a805adf0f143e82adf2))

## [3.0.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.3.0...v3.0.0) (2026-06-14)

### ⚠ BREAKING CHANGES

* **engines:** require Node 22 or 24, drop Node 20 (#398)

### Features

* **engines:** require Node 22 or 24, drop Node 20 ([#398](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/398)) ([96c4108](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/96c41081c8ca1f0cb6c619df476f92870fe6c5f3))

## [2.3.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.2.4...v2.3.0) (2026-06-09)

### Features

* **ci:** upload CycloneDX SBOM to Dependency-Track ([#396](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/396)) ([ef8031e](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/ef8031e01037feafe190ca30b7d112ad79adbfbb))

## [2.2.4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.2.3...v2.2.4) (2026-05-25)

### Bug Fixes

* **deps:** update dependency homebridge-lib to v8 ([#369](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/369)) ([1f74ceb](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/1f74ceb842a8582b8c2f6e7233abb85b37d87c2b))

## [2.2.3](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.2.2...v2.2.3) (2026-02-14)

### Bug Fixes

* use correct config property for Entertainment TV lightbulb ([#346](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/346)) ([13b1953](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/13b1953e018509968461b33d4b99bc4ba8340699))

## [2.2.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.2.1...v2.2.2) (2026-02-14)

### Bug Fixes

* **deps:** update vulnerable dependencies ([f77890e](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/f77890ed6db8b21bb398938af7529832eefd89a4))

## [2.2.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.2.0...v2.2.1) (2026-02-14)

### Bug Fixes

* **deps:** revert eslint to v9 for typescript-eslint compatibility ([#347](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/347)) ([9969c2e](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/9969c2e505fc257ee51da61973a98e06c3da5ba8)), closes [#344](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/344)

## [2.2.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.1.1...v2.2.0) (2025-12-19)

### Features

* add power switch accessory for separate power control  ([#320](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/320)) ([7eb6423](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/7eb6423541ed8ccf990ef43c811aae0e25dbb906))

## [2.1.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.1.0...v2.1.1) (2025-11-19)

### Bug Fixes

* Fix invalid config schema ([#294](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/294)) ([d197028](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/d1970284f4b136a1d8188b00ef73354772be9513))

## [2.1.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v2.0.0...v2.1.0) (2025-11-17)

### Features

* Make TV power state conditons configurable ([#284](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/284)) ([5334c21](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/5334c214f152b3c4c6028271f45f519f68fce69f))

## [2.0.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.2.4...v2.0.0) (2025-11-16)

### ⚠ BREAKING CHANGES

* Add support for Node 24 and drop Node 18 support (#283)

### Features

* Add support for Node 24 and drop Node 18 support ([#283](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/283)) ([f2b5ed8](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/f2b5ed82aed380c5781ef5cac11f5e5a4d8569db))
* **deps:** update all non-major dependencies ([#218](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/218)) ([5ee467f](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/5ee467f572429ab4f05ccca858a9f26c7f60ea3d))
* **deps:** update dependency homebridge-config-ui-x to v5.7.0 ([#220](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/220)) ([65f8b12](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/65f8b120bbc117460bfb712e07835068598d084a))

## [1.2.4](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.2.3...v1.2.4) (2025-06-29)

### Bug Fixes

* support old "TV"(uppercase) default config. Fixes [#188](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/188) ([#191](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/191)) ([554b167](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/554b167ab95d33d567a5babf762232e2a750e3a1))

## [1.2.3](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.2.2...v1.2.3) (2025-02-04)

### Bug Fixes

* Error state now propagates to HomeKit ([4b2cae1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/4b2cae19121a8c4451640c77d36ad5621b36e58b))

## [1.2.2](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.2.1...v1.2.2) (2025-01-28)

### Bug Fixes

* Offline sync box is now only a fatal error if it occurs at startup ([#123](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/123)) ([695513c](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/695513cd467fe58c970436098b6f2bd3f67f78d1))

## [1.2.1](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.2.0...v1.2.1) (2025-01-26)

### Bug Fixes

* Enforce valid config using Homebridge Config UI ([5c1bd37](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/5c1bd37efcbf99710ebaa4af5419b4e7a47878ed))

## [1.2.0](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.6...v1.2.0) (2025-01-24)

### Features

* Support multiple instances of the plugin and multiple sync boxes ([#46](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/46)) ([949346b](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/949346be7bbee35f268f5aa8089b3dbd9b42b567))

## [1.1.6](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.5...v1.1.6) (2025-01-22)

### Bug Fixes

* only use API object provided categories and make type config case insensitive ([410730b](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/410730b0b274ff3c39e7d9c96c578f16e943c345))

## [1.1.5](https://github.com/jabrown93/homebridge-philips-hue-sync-box/compare/v1.1.4...v1.1.5) (2025-01-21)

### Bug Fixes

* Removes non-functional "Base Accessory Name" config, Homebridge cannot sync this to HomeKit ([#110](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues/110)) ([25deadc](https://github.com/jabrown93/homebridge-philips-hue-sync-box/commit/25deadc5ef3f632d7e96074fc7646cd20d1ddd98))

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
