export type EventCallback = (event: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(userId: string, cb: EventCallback): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(cb);
    return () => {
      const set = this.listeners.get(userId);
      if (set) {
        set.delete(cb);
        if (set.size === 0) this.listeners.delete(userId);
      }
    };
  }

  emit(userId: string, event: any): void {
    const set = this.listeners.get(userId);
    if (!set) return;
    set.forEach((cb) => {
      try { cb(event); } catch (err) { console.error('EventBus listener error:', err); }
    });
  }
}

export const eventBus = new EventBus();
