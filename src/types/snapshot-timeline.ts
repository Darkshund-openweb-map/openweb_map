export type PlaybackSpeed = 1 | 2 | 4;

export type SnapshotQuarter = {
  label: string;
  date: string;
};

export type SnapshotTimelineState = {
  quarters: SnapshotQuarter[];
  index: number;
  current: SnapshotQuarter;
  baseline: string;
  isLatest: boolean;
  available: boolean;
  playing: boolean;
  speed: PlaybackSpeed;
  seek: (index: number) => void;
  reset: () => void;
  togglePlay: () => void;
  pause: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
};
