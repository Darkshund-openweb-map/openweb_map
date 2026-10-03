'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Relation } from '@/lib/ecosystem-types';

function popupPosition(trigger: HTMLButtonElement) {
  const margin = 16;
  const width = Math.min(390, window.innerWidth - margin * 2);
  const panel = trigger.closest('[data-detail-panel]')?.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  const leftOfPanel = (panel?.left ?? anchor.left) - width - margin;
  const fitsLeft = leftOfPanel >= margin;
  const top = Math.max(72, Math.min(fitsLeft ? anchor.top : 96, window.innerHeight - 480));
  return {
    left: fitsLeft ? leftOfPanel : (window.innerWidth - width) / 2,
    top,
    width,
    maxHeight: Math.min(640, window.innerHeight - top - margin),
  };
}

type Popup = {
  relation: Relation;
  trigger: HTMLButtonElement;
  position: ReturnType<typeof popupPosition>;
};

export function useRelationPopup(onCloseRelation: () => void) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const popupRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(
    (restoreFocus = true) => {
      setPopup(null);
      onCloseRelation();
      if (restoreFocus && triggerRef.current?.isConnected)
        triggerRef.current.focus({ preventScroll: true });
    },
    [onCloseRelation],
  );

  const open = (relation: Relation, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setPopup({ relation, trigger, position: popupPosition(trigger) });
  };

  useEffect(() => {
    if (popup) closeButtonRef.current?.focus({ preventScroll: true });
  }, [popup]);

  useEffect(() => {
    if (!popup) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!popupRef.current?.contains(event.target) && !popup.trigger.contains(event.target))
        close(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    const reposition = () =>
      setPopup((current) =>
        current ? { ...current, position: popupPosition(current.trigger) } : null,
      );
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [popup, close]);

  return { popup, popupRef, closeButtonRef, open, close };
}
