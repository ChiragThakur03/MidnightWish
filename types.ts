export enum AppPhase {
  LOCKED = 'LOCKED',
  REVEAL = 'REVEAL',
  CANDLE = 'CANDLE',
  MESSAGE = 'MESSAGE'
}

export interface AudioConfig {
  threshold: number;
  smoothing: number;
}
