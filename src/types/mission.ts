export enum MissionPhase {
  STANDBY = 'STANDBY',
  DEPLOYING_BOAT = 'DEPLOYING_BOAT',
  ON_STATION = 'ON_STATION',
  AUV_RELEASED = 'AUV_RELEASED',
  DATA_COLLECTION = 'DATA_COLLECTION',
  HOMING = 'HOMING',
  EMERGENCY_RECOVERY = 'EMERGENCY_RECOVERY',
  DOCKING = 'DOCKING',
  RECOVERED = 'RECOVERED',
  RETURN_TO_BASE = 'RETURN_TO_BASE'
}

export type Coordinates = {
  lat: number;
  lng: number;
};

export type TelemetryData = {
  depth: number;
  temp: number;
  ph: number;
  heading: number;
  speed: number;
};

export type SystemStatus = {
  boatBattery: number;
  auvBattery: number;
  rfLink: number; // Mbps
  acousticLink: number; // kbps
  opticalLink: number; // Mbps
};

export type LogEntry = {
  id: number;
  time: string;
  msg: string;
  type: 'info' | 'warn' | 'success';
};
