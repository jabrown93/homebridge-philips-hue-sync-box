export interface Device {
  name: string;
  deviceType: string;
  uniqueId: string;
  apiLevel: number;
  firmwareVersion: string;
  buildNumber: number;
  termsAgreed: boolean;
  wifiState: string;
  ipAddress: string;
  wifi: {
    ssid: string;
    strength: number;
  };
  lastCheckedUpdate: string;
  updatableBuildNumber: number | null;
  updatableFirmwareVersion: string | null;
  update: {
    autoUpdateEnabled: boolean;
    autoUpdateTime: number;
  };
  ledMode: number;
  action: string;
  pushlink: string;
  capabilities: {
    maxIrCodes: number;
    maxPresets: number;
  };
  beta: boolean;
  overheating: boolean;
  undervolt: boolean;
  bluetooth: boolean;
}

export interface HueGroup {
  name: string;
  numLights: number;
  active: boolean;
}

export interface Hue {
  bridgeUniqueId: string;
  bridgeIpAddress: string;
  groupId: string;
  groups: {
    [key: string]: HueGroup;
  };
  connectionState: string;
}

export interface ExecutionVideo {
  intensity: string;
  backgroundLighting: boolean;
}

export interface ExecutionGame {
  intensity: string;
  backgroundLighting: boolean;
}

export interface ExecutionMusic {
  intensity: string;
  palette: string;
}

export interface Execution {
  mode: string;
  syncActive: boolean;
  hdmiActive: boolean;
  hdmiSource: string;
  hueTarget: string;
  brightness: number;
  intensity: string;
  lastSyncMode: string;
  video: ExecutionVideo;
  game: ExecutionGame;
  music: ExecutionMusic;
  preset: string | null;
}

export interface HdmiInput {
  name: string;
  type: string;
  status: string;
  lastSyncMode: string;
}

export interface Hdmi {
  input1: HdmiInput;
  input2: HdmiInput;
  input3: HdmiInput;
  input4: HdmiInput;
  output: HdmiInput;
  contentSpecs: string;
  videoSyncSupported: boolean;
  audioSyncSupported: boolean;
}

export interface BehaviorInput {
  cecInputSwitch: number;
  hpdInputPortSwitch: number;
  linkAutoSync: number;
}

export interface Behavior {
  inactivePowersave: number;
  cecPowersave: number;
  usbPowersave: number;
  hpdInputSwitch: number;
  hpdOutputEnableMs: number;
  arcBypassMode: number;
  input1: BehaviorInput;
  input2: BehaviorInput;
  input3: BehaviorInput;
  input4: BehaviorInput;
}

export interface IrScan {
  scanning: boolean;
  code: string | null;
  codes: string[];
}

export interface Ir {
  defaultCodes: boolean;
  scan: IrScan;
  codes: {
    [key: string]: never;
  };
}

export interface Registration {
  appName: string;
  instanceName: string;
  role: string;
  verified: boolean;
  lastUsed: string;
  created: string;
}

export interface State {
  device: Device;
  hue: Hue;
  execution: Execution;
  hdmi: Hdmi;
  behavior: Behavior;
  ir: Ir;
  registrations: {
    [key: string]: Registration;
  };
  presets: {
    [key: string]: never;
  };
}
