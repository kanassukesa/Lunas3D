/** Event bus tipado e minimalista. */
type Handler<T> = (payload: T) => void;

export class EventBus<M extends Record<string, unknown>> {
  private map = new Map<keyof M, Set<Handler<never>>>();
  on<K extends keyof M>(type: K, fn: Handler<M[K]>): () => void {
    let set = this.map.get(type);
    if (!set) this.map.set(type, (set = new Set()));
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }
  emit<K extends keyof M>(type: K, payload: M[K]): void {
    const set = this.map.get(type);
    if (!set) return;
    for (const fn of set) (fn as Handler<M[K]>)(payload);
  }
}
