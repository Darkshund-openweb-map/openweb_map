'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EcosystemEvent } from '@/lib/ecosystem-types';

function popupPosition(trigger: HTMLButtonElement) {
  const margin = 16;
  const width = Math.min(380, window.innerWidth - margin * 2);
  const panel = trigger.closest('[data-detail-panel]')?.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  const leftOfPanel = (panel?.left ?? anchor.left) - width - margin;
  const fitsLeft = leftOfPanel >= margin;
  const top = Math.max(72, Math.min(fitsLeft ? anchor.top : 100, window.innerHeight - 320));
  return {
    left: fitsLeft ? leftOfPanel : (window.innerWidth - width) / 2,
    top,
    width,
    maxHeight: Math.min(520, window.innerHeight - top - margin),
  };
}

type Popup = {
  event: EcosystemEvent;
  trigger: HTMLButtonElement;
  position: ReturnType<typeof popupPosition>;
};

// 팝업은 명시적인 사건 클릭으로만 열고, 목록 필터/플랫폼 전환 시 부모 목록과 함께 해제한다.
export function useIncidentPopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const popupRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const eventId = popup?.event.id;

  const close = useCallback((restoreFocus = true) => {
    setPopup(null);
    if (restoreFocus && triggerRef.current?.isConnected) {
      triggerRef.current.focus({ preventScroll: true });
    }
  }, []);

  const open = (event: EcosystemEvent, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setPopup({ event, trigger, position: popupPosition(trigger) });
  };

  useEffect(() => {
    if (eventId) closeButtonRef.current?.focus({ preventScroll: true });
  }, [eventId]);

  useEffect(() => {
    if (!popup) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!popupRef.current?.contains(event.target) && !popup.trigger.contains(event.target)) {
        close(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    const reposition = (event: Event) => {
      if (event.target instanceof Node && popupRef.current?.contains(event.target)) return;
      setPopup((current) =>
        current ? { ...current, position: popupPosition(current.trigger) } : null,
      );
    };
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
