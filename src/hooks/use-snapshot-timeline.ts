'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EcosystemSnapshot } from '@/lib/ecosystem-types';
import type { PlaybackSpeed, SnapshotTimelineState } from '@/types/snapshot-timeline';
import { createSnapshotQuarters, hasTimelineData } from '@/lib/snapshot-timeline';

export function useSnapshotTimeline(snapshot: EcosystemSnapshot): SnapshotTimelineState {
  const quarters = useMemo(() => createSnapshotQuarters(snapshot), [snapshot]);
  const available = hasTimelineData(snapshot);
  const last = quarters.length - 1;
  const [playback, setPlayback] = useState<{ index: number | null; playing: boolean }>({
    index: null,
    playing: false,
  });
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const index = Math.min(playback.index ?? last, last);
  const playing = playback.playing && available;
  const pause = useCallback(() => setPlayback((current) => ({ ...current, playing: false })), []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPlayback((current) => {
        const next = Math.min((current.index ?? last) + 1, last);
        return { index: next, playing: next < last };
      });
    }, 1000 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, last]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pause]);

  return {
    quarters,
    index,
    current: quarters[index],
    baseline: snapshot.updatedAt,
    isLatest: index === last,
    available,
    playing,
    speed,
    pause,
    setSpeed,
    seek: (next) => {
      if (Number.isFinite(next))
        setPlayback({ index: Math.max(0, Math.min(Math.round(next), last)), playing: false });
    },
    reset: () => setPlayback({ index: null, playing: false }),
    togglePlay: () => {
      if (!available) return;
      setPlayback((current) => ({
        index: (current.index ?? last) >= last ? 0 : current.index,
        playing: !current.playing,
      }));
    },
  };
}
