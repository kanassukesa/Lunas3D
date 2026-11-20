/** Object pool genérico: evita alocação/GC em projéteis, inimigos, partículas e números. */
export class Pool<T> {
  private free: T[] = [];
  constructor(
    private factory: () => T,
    private reset?: (o: T) => void,
    prefill = 0,
  ) {
    for (let i = 0; i < prefill; i++) this.free.push(factory());
  }
  get(): T {
    return this.free.pop() ?? this.factory();
  }
  release(o: T): void {
    this.reset?.(o);
    this.free.push(o);
  }
  get available(): number {
    return this.free.length;
  }
}
