<p align="center">

<img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

<span align="center">

# Homebridge Philips Hue Sync Box Plugin

</span>

[![npm version](https://badgen.net/npm/v/homebridge-philips-hue-sync-box?color=purple&icon=npm&label)](https://www.npmjs.com/package/homebridge-philips-hue-sync-box)
[![npm downloads](https://badgen.net/npm/dw/homebridge-philips-hue-sync-box?color=purple&icon=npm&label)](https://www.npmjs.com/package/homebridge-philips-hue-sync-box)
[![GitHub Stars](https://badgen.net/github/stars/jabrown93/homebridge-philips-hue-sync-box?color=cyan&icon=github)](https://github.com/jabrown93/homebridge-philips-hue-sync-box)
[![GitHub Last Commit](https://badgen.net/github/last-commit/jabrown93/homebridge-philips-hue-sync-box?color=cyan&icon=github)](https://github.com/jabrown93/homebridge-philips-hue-sync-box)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/jabrown93/homebridge-philips-hue-sync-box.svg)](https://github.com/jabrown93/homebridge-philips-hue-sync-box/pulls)
[![GitHub issues](https://img.shields.io/github/issues/jabrown93/homebridge-philips-hue-sync-box.svg)](https://github.com/jabrown93/homebridge-philips-hue-sync-box/issues)
[![FOSSA Status](https://app.fossa.com/api/projects/custom%2B50603%2Fgithub.com%2Fjabrown93%2Fhomebridge-philips-hue-sync-box.svg?type=shield&issueType=license)](https://app.fossa.com/projects/custom%2B50603%2Fgithub.com%2Fjabrown93%2Fhomebridge-philips-hue-sync-box?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/custom%2B50603%2Fgithub.com%2Fjabrown93%2Fhomebridge-philips-hue-sync-box.svg?type=shield&issueType=security)](https://app.fossa.com/projects/custom%2B50603%2Fgithub.com%2Fjabrown93%2Fhomebridge-philips-hue-sync-box?ref=badge_shield&issueType=security)

Homebridge plugin for the Philips Hue Sync Box.

The Sync Box can be exposed as a lightbulb. The following features are supported:

- On/Off
- Brightness

The Sync Box can be exposed as a switch. The following features are supported:

- On/Off

You can also enable additional TV accessories that support:

- Switching HDMI inputs
- Switching modes
- Switching intensity
- Switching entertainment areas

Each of the additional TV accessories supports the iOS remote widget:

- Up/down: change brightness
- Left/right: change intensity
- Select (center button): toggle modes
- Information button: toggle HDMI inputs
- Play/Pause: toggle on/off

Additionally, each TV accessory can have an integrated lightbulb with support for:

- On/Off
- Brightness

**Important**: TV accessories must be added to HomeKit manually, the logs show the pin for adding them (should be the
same pin as for the plugin).

## Installation

Install the plugin via npm:

```bash
npm install homebridge-philips-hue-sync-box -g
```

## Prepare Sync Box

You have to create new credentials to communicate with the Philips Hue Sync Box:

- Make sure the Sync Box is on
- Make sure synchronization is stopped
- Make an HTTP POST request to `https://<SYNC-BOX-IP>/api/v1/registrations`
- The body of the request has to be JSON:
  `{ "appName": "homebridge", "appSecret": "MDAwMTExMDAwMTExMDAwMTExMDAwMTExMDAwMTExMDA=", "instanceName": "homebridge" }`
- The first response to the request will be `{ "code": 16, "message": "Invalid State" }`
- IMPORTANT: Now, click and hold the button of the Sync Box until the LED switches to green. Immediately release the
  button as soon as the LED is green! It will switch to white again.
- Immediately make the request again
- The response contains an `accessToken` string

Hints:

- One way to do this is to enter the following into the Terminal:
  `curl -H "Content-Type: application/json" -X POST -d '{"appName": "homebridge", "appSecret":"MDAwMTExMDAwMTExMDAwMTExMDAwMTExMDAwMTExMDA=", "instanceName": "homebridge"}' https://<SYNC-BOX-IP>/api/v1/registrations`,
  replacing `<SYNC-BOX-IP>` with the IP address of your Sync Box. If an issue occurs due to a certificate error, add the
  parameter `-k` to the cURL command.
- Another way may be to use tools like **Postman**. Set the request method to `POST` and enter
  `https://<SYNC-BOX-IP>/api/v1/registrations` as the request URL (replace `<SYNC-BOX-IP>` with the IP address of your
  Sync Box). Next, open the tab "Body", set the type to "raw" and select "JSON" as the content type in the dropdown.
  Then, enter
  `{ "appName": "homebridge", "appSecret": "MDAwMTExMDAwMTExMDAwMTExMDAwMTExMDAwMTExMDA=", "instanceName": "homebridge" }`
  into the text box for the body. Click on the "Send" button at the top right to send the request. If an issue occurs
  due to a certificate error, you can disable certificate verification in Postman. Go to the global settings, open the
  tab "General" and disable the toggle switch for "SSL certificate verification".

## Multiple Sync Boxes

**WARNING: If you currently have a sync box setup, setting a `uuidSeed` will reset them. You may leave this config blank
on at most 1 Sync Box.**

In order to support multiple Sync Boxes, you have to run multiple instances of this plugin. Each instance has to have a
unique `uuidSeed` value. This value is used to differentiate the accessories in HomeKit. If you have existing
accessories, changing this value will cause them to be removed and re-created. HomeKit will consider these as new
accessories and you will need to setup them up again.

You will need to add multiple platforms to your `config.json` file. This can be found at
`https://<homebridge_host>/config` in the UI or `<homebridge_config_dir>/config.json`. Each platform has to have a
a `platform` value of `PhilipsHueSyncBoxPlatform`.

**Important Notes**

- The `uuidSeed` value must be unique for each Sync Box. `''` is a valid value for one Sync Box.
- Changing the `uuidSeed` value will cause the accessories to be removed and re-created. HomeKit will consider these as new accessories and you will need to setup them up again.
- The `name` value should be unique for each Sync Box, this improves the logging output.

```json5
{
  //rest of config
  platforms: [
    {
      platform: 'PhilipsHueSyncBoxPlatform',
      name: 'LivingRoomPhilipsHueSyncBoxPlatform',
      syncBoxIpAddress: '<SYNC-BOX-IP-ADDRESS>',
      syncBoxApiAccessToken: '<ACCESS-TOKEN>',
      uuidSeed: 'LivingRoom',
      // rest of config
    },
    {
      platform: 'PhilipsHueSyncBoxPlatform',
      name: 'BedroomPhilipsHueSyncBoxPlatform',
      syncBoxIpAddress: '<SYNC-BOX-IP-ADDRESS>',
      syncBoxApiAccessToken: '<ACCESS-TOKEN>',
      uuidSeed: 'Bedroom',
      // rest of config
    },
  ],
}
```

## Configuration

| **Name**                                 | **Description**                                                                                                                                                                                                                                                                            | **Type** | **Default**   | **Required** | **Allowed Values**                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | ------------ | --------------------------------------------- |
| `syncBoxIpAddress`                       | The IP address of your Philips Hue Sync Box.                                                                                                                                                                                                                                               | string   | None          | Yes          |                                               |
| `syncBoxApiAccessToken`                  | The access token that you get while registration.                                                                                                                                                                                                                                          | string   | None          | Yes          |                                               |
| `defaultOnMode`                          | The mode that is used when switching the Sync Box on via HomeKit. Possible values are `video`, `music`, `game` or `lastSyncMode`.                                                                                                                                                          | string   | `video`       | No           | `video`, `music`, `game`, `lastSyncMode`      |
| `defaultOffMode`                         | The mode that is used when switching the Sync Box off via HomeKit. Possible values are `powersave` or `passthrough`.                                                                                                                                                                       | string   | `passthrough` | No           | `powersave`, `passthrough`                    |
| `baseAccessory`                          | Determines the type of the base accessory for the Sync Box. Possible values are `lightbulb`, `switch` or `none`. If `none` is used, no base accessory is exposed.                                                                                                                          | string   | `lightbulb`   | No           | `lightbulb`, `switch`, `none`                 |
| `baseAccessoryName`                      | Sets custom name for the Base Accessory. Overwrites names configured HomeKit.                                                                                                                                                                                                              | string   | None          | No           |                                               |
| `tvAccessory`                            | Enables a TV Accessory for switching the inputs of the Sync Box.                                                                                                                                                                                                                           | boolean  | `false`       | No           |                                               |
| `tvAccessoryConfiguredName`              | Sets custom name for the HDMI Input TV. Overwrites names configured HomeKit.                                                                                                                                                                                                               | string   | None          | No           |                                               |
| `tvAccessoryType`                        | Type of icon that the Apple Home app should show. Possible values are `tv`, `settopbox`, `tvstick` or `audioreceiver`.                                                                                                                                                                     | string   | `tv`          | No           | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `tvAccessoryLightbulb`                   | Enables an integrated lightbulb for the TV Accessory for switching the inputs.                                                                                                                                                                                                             | boolean  | `false`       | No           |                                               |
| `modeTvAccessory`                        | Enables a TV Accessory for switching the modes (`video`, `music`, `game`) of the Sync Box.                                                                                                                                                                                                 | boolean  | `false`       | No           |                                               |
| `modeTvAccessoryConfiguredName`          | Sets custom name for the Mode TV. Overwrites names configured HomeKit.                                                                                                                                                                                                                     | string   | None          | No           |                                               |
| `modeTvAccessoryType`                    | Type of icon that the Apple Home app should show. Possible values are `tv`, `settopbox`, `tvstick` or `audioreceiver`.                                                                                                                                                                     | string   | `tv`          | No           | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `modeTvAccessoryLightbulb`               | Enables an integrated lightbulb for the TV Accessory for switching the modes.                                                                                                                                                                                                              | boolean  | `false`       | No           |                                               |
| `intensityTvAccessory`                   | Enables a TV Accessory for switching the intensity (`subtle`, `moderate`, `high`, `intense`) of the Sync Box.                                                                                                                                                                              | boolean  | `false`       | No           |                                               |
| `intensityTvAccessoryConfiguredName`     | Sets custom name for the Intensity TV. Overwrites names configured HomeKit.                                                                                                                                                                                                                | string   | None          | No           |                                               |
| `intensityTvAccessoryType`               | Type of icon that the Apple Home app should show. Possible values are `tv`, `settopbox`, `tvstick` or `audioreceiver`.                                                                                                                                                                     | string   | `tv`          | No           | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `intensityTvAccessoryLightbulb`          | Enables an integrated lightbulb for the TV Accessory for switching the intensity.                                                                                                                                                                                                          | boolean  | `false`       | No           |                                               |
| `entertainmentTvAccessory`               | Enables a TV Accessory for switching the entertainment area of the Sync Box.                                                                                                                                                                                                               | boolean  | `false`       | No           |                                               |
| `entertainmentTvAccessoryConfiguredName` | Sets custom name for the Entertainment TV. Overwrites names configured HomeKit.                                                                                                                                                                                                            | string   | None          | No           |                                               |
| `entertainmentTvAccessoryType`           | Type of icon that the Apple Home app should show. Possible values are `tv`, `settopbox`, `tvstick` or `audioreceiver`.                                                                                                                                                                     | string   | `tv`          | No           | `tv`, `settopbox`, `tvstick`, `audioreceiver` |
| `entertainmentTvAccessoryLightbulb`      | Enables an integrated lightbulb for the TV Accessory for switching the entertainment areas.                                                                                                                                                                                                | boolean  | `false`       | No           |                                               |
| `updateIntervalInSeconds`                | The interval in seconds in which the plugin polls the Sync Box for updates.                                                                                                                                                                                                                | integer  | `5`           | No           |                                               |
| `uuidSeed`                               | Only set this if you're running multiple instances of this plugin to differentiate the accessories. If you have existing accessories, changing this will cause them to be removed and re-created. HomeKit will consider these as new accessories and you will need to setup them up again. | string   | None          | No           |                                               |
| `apiServerEnabled`                       | Enables an HTTP API for controlling the Sync Box.                                                                                                                                                                                                                                          | boolean  | `false`       | No           |                                               |
| `apiServerPort`                          | The port that the API (if enabled) runs on. Defaults to `40220`, please change this setting if the port is already in use.                                                                                                                                                                 | integer  | `40220`       | No           |                                               |
| `apiServerToken`                         | The token that has to be included in each request of the API. Is required if the API is enabled and has no default value.                                                                                                                                                                  | string   | None          | No           |                                               |

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
      "tvAccessory": false,
      "tvAccessoryType": "tv",
      "tvAccessoryLightbulb": false,
      "modeTvAccessory": false,
      "modeTvAccessoryType": "tv",
      "modeTvAccessoryLightbulb": false,
      "intensityTvAccessory": false,
      "intensityTvAccessoryType": "tv",
      "intensityTvAccessoryLightbulb": false,
      "entertainmentTvAccessory": false,
      "entertainmentTvAccessoryType": "tv",
      "entertainmentTvAccessoryLightbulb": false
    }
  ]
}
```

## API

This plugin also provides an HTTP API to control some features of the Sync Box. It has been created so that you can
further automate the system with HomeKit shortcuts. Starting with iOS 13, you can use shortcuts for HomeKit automation.
Those automations that are executed on the HomeKit coordinator (i.e. iPad, AppleTV or HomePod) also support HTTP
requests, which means you can automate your Sync Box without annoying switches and buttons exposed in HomeKit.

If the API is enabled, it can be reached at the specified port on the host of this plugin.

```
http://<YOUR-HOST-IP-ADDRESS>:<apiPort>
```

The token has to be specified as value of the `Authorization` header on each request:

```
Authorization: <YOUR-TOKEN>
```

### API - GET

Use the `state` endpoint to retrieve the state of the Sync Box. The HTTP method has to be `GET`:

```
http://<YOUR-HOST-IP-ADDRESS>:<apiPort>/state
```

The response is a JSON response, the following properties are included:

```
{
	"device": {
		"name": "Living Room Sync Box",
		"deviceType": "HSB2",
		"uniqueId": "ID2",
		"apiLevel": 10,
		"firmwareVersion": "2.4.1",
		"buildNumber": 784734914,
		"termsAgreed": true,
		"wifiState": "wan",
		"ipAddress": "192.168.1.3",
		"wifi": {
			"ssid": "Guest Network",
			"strength": 4
		},
		"lastCheckedUpdate": "2025-01-07T10:04:23Z",
		"updatableBuildNumber": null,
		"updatableFirmwareVersion": null,
		"update": {
			"autoUpdateEnabled": true,
			"autoUpdateTime": 10
		},
		"ledMode": 1,
		"action": "none",
		"pushlink": "idle",
		"capabilities": {
			"maxIrCodes": 24,
			"maxPresets": 16
		},
		"beta": false,
		"overheating": false,
		"undervolt": false,
		"bluetooth": false
	},
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
	},
	"hdmi": {
		"input1": {
			"name": "HDMI 1",
			"type": "generic",
			"status": "unplugged",
			"lastSyncMode": "video"
		},
		"input2": {
			"name": "HDMI 2",
			"type": "generic",
			"status": "unplugged",
			"lastSyncMode": "video"
		},
		"input3": {
			"name": "HDMI 3",
			"type": "generic",
			"status": "unplugged",
			"lastSyncMode": "video"
		},
		"input4": {
			"name": "AVR",
			"type": "avreceiver",
			"status": "linked",
			"lastSyncMode": "video"
		},
		"output": {
			"name": "HDMI Out",
			"type": "generic",
			"status": "linked",
			"lastSyncMode": "video"
		},
		"contentSpecs": "3840 x 2160 @ 60000 - SDR",
		"videoSyncSupported": true,
		"audioSyncSupported": true
	},
	"behavior": {
		"inactivePowersave": 20,
		"cecPowersave": 1,
		"usbPowersave": 1,
		"hpdInputSwitch": 1,
		"hpdOutputEnableMs": 1500,
		"arcBypassMode": 1,
		"input1": {
			"cecInputSwitch": 1,
			"hpdInputPortSwitch": 1,
			"linkAutoSync": 0
		},
		"input2": {
			"cecInputSwitch": 1,
			"hpdInputPortSwitch": 1,
			"linkAutoSync": 0
		},
		"input3": {
			"cecInputSwitch": 1,
			"hpdInputPortSwitch": 1,
			"linkAutoSync": 0
		},
		"input4": {
			"cecInputSwitch": 1,
			"hpdInputPortSwitch": 1,
			"linkAutoSync": 0
		}
	},
	"ir": {
		"defaultCodes": true,
		"scan": {
			"scanning": false,
			"code": null,
			"codes": []
		},
		"codes": {}
	},
	"registrations": {
	},
	"presets": {}
}
```

### API - POST

Use the `state` endpoint to set state of the Sync Box. The HTTP method has to be `POST`:

```
http://<YOUR-HOST-IP-ADDRESS>:<apiPort>/state
```

The body of the request has to be JSON and can contain any/some/all of the following values:

```
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
			"56169ef5-be8e-4866-adce-ff3800aca35e": {
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
