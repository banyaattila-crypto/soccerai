import { useEffect } from 'react';

export type SoccerAiEventMap = {
  audit_log_updated: void;
  settings_updated: void;
  filter_live: void;
  pin_state_changed: void;
  pin_locked: void;
};

export type SoccerAiEventType = keyof SoccerAiEventMap;

type Listener<T> = (data: T) => void;

class TypedEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<SoccerAiEventType, Set<Listener<any>>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Transzparens kétirányú szinkronizáció a böngésző DOM eseményeivel (kompatibilitási híd)
      window.addEventListener('focitipp_audit_log_updated', () => {
        this.emitInternal('audit_log_updated', undefined, false);
      });
      window.addEventListener('focitipp_settings_updated', () => {
        this.emitInternal('settings_updated', undefined, false);
      });
      window.addEventListener('focitipp_filter_live', () => {
        this.emitInternal('filter_live', undefined, false);
      });
      window.addEventListener('focitipp_pin_state_changed', () => {
        this.emitInternal('pin_state_changed', undefined, false);
      });
      window.addEventListener('focitipp_pin_locked', () => {
        this.emitInternal('pin_locked', undefined, false);
      });
    }
  }

  private emitInternal(
    event: SoccerAiEventType,
    data?: unknown,
    forwardToWindow: boolean = true
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`Hiba az eseménykezelőben [${event}]:`, err);
        }
      });
    }

    if (
      forwardToWindow &&
      typeof window !== 'undefined' &&
      typeof window.dispatchEvent === 'function' &&
      typeof CustomEvent === 'function'
    ) {
      window.dispatchEvent(new CustomEvent(`focitipp_${event}`, { detail: data }));
    }
  }

  emit<K extends SoccerAiEventType>(event: K, data?: SoccerAiEventMap[K]): void {
    this.emitInternal(event, data, true);
  }

  on<K extends SoccerAiEventType>(
    event: K,
    listener: Listener<SoccerAiEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.off(event, listener);
    };
  }

  off<K extends SoccerAiEventType>(
    event: K,
    listener: Listener<SoccerAiEventMap[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }
}

export const eventBus = new TypedEventBus();

/**
 * Típusbiztos React hook az eventBus események lehallgatására automatikus leiratkozással
 */
export function useEventBus<K extends SoccerAiEventType>(
  event: K,
  callback: Listener<SoccerAiEventMap[K]>
): void {
  useEffect(() => {
    return eventBus.on(event, callback);
  }, [event, callback]);
}
