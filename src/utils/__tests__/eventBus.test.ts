import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../eventBus';

describe('TypedEventBus and Event Subscription', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribes to and receives typed events', () => {
    const listener = vi.fn();
    const unsubscribe = eventBus.on('settings_updated', listener);

    eventBus.emit('settings_updated');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    eventBus.emit('settings_updated');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('supports multiple listeners for the same event without interference', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubA = eventBus.on('filter_live', listenerA);
    const unsubB = eventBus.on('filter_live', listenerB);

    eventBus.emit('filter_live');
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unsubA();
    eventBus.emit('filter_live');
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(2);

    unsubB();
  });

  it('handles isolated error in one listener gracefully without crashing others', () => {
    const faultyListener = vi.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const healthyListener = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const unsub1 = eventBus.on('audit_log_updated', faultyListener);
    const unsub2 = eventBus.on('audit_log_updated', healthyListener);

    expect(() => {
      eventBus.emit('audit_log_updated');
    }).not.toThrow();

    expect(healthyListener).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();

    unsub1();
    unsub2();
  });

  it('dispatches to window when window.dispatchEvent exists', () => {
    const windowSpy = vi.fn();
    const originalWindow = globalThis.window;
    // @ts-expect-error Mocking window for testing dispatch bridge
    globalThis.window = {
      dispatchEvent: windowSpy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    // @ts-expect-error Mocking CustomEvent
    globalThis.CustomEvent = class {
      type: string;
      detail?: unknown;
      constructor(type: string, opts?: { detail?: unknown }) {
        this.type = type;
        this.detail = opts?.detail;
      }
    };

    eventBus.emit('filter_live');
    expect(windowSpy).toHaveBeenCalled();

    globalThis.window = originalWindow;
  });
});
