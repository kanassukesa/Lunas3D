/** Grid uniforme para colisão/consulta por vizinhança (células de 128 px). */
export interface GridItem {
  x: number;
  y: number;
  r: number;
}

export class SpatialGrid<T extends GridItem> {
  private cells = new Map<number, T[]>();
  private used: T[][] = [];
  private spare: T[][] = [];
  constructor(public cellSize = 128) {}

  private key(cx: number, cy: number): number {
    return (cx + 512) * 4096 + (cy + 512);
  }

  clear(): void {
    for (const arr of this.used) {
      arr.length = 0;
      this.spare.push(arr);
    }
    this.used.length = 0;
    this.cells.clear();
  }

  insert(item: T): void {
    const cs = this.cellSize;
    const x0 = Math.floor((item.x - item.r) / cs);
    const x1 = Math.floor((item.x + item.r) / cs);
    const y0 = Math.floor((item.y - item.r) / cs);
    const y1 = Math.floor((item.y + item.r) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = this.key(cx, cy);
        let arr = this.cells.get(k);
        if (!arr) {
          arr = this.spare.pop() ?? [];
          this.cells.set(k, arr);
          this.used.push(arr);
        }
        arr.push(item);
      }
    }
  }

  /** Chama fn para cada item cujas células tocam o círculo (pode repetir itens grandes; dedupe por marca). */
  query(x: number, y: number, r: number, out: T[]): T[] {
    out.length = 0;
    const cs = this.cellSize;
    const x0 = Math.floor((x - r) / cs);
    const x1 = Math.floor((x + r) / cs);
    const y0 = Math.floor((y - r) / cs);
    const y1 = Math.floor((y + r) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (const it of arr) {
          const dx = it.x - x;
          const dy = it.y - y;
          const rr = r + it.r;
          if (dx * dx + dy * dy <= rr * rr && out.indexOf(it) < 0) out.push(it);
        }
      }
    }
    return out;
  }
}
