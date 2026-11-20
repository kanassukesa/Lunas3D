/** Fixed timestep (60 Hz) para a lógica; render livre. Multiplicador de velocidade x1/x2. */
export class FixedLoop {
  readonly dt = 1 / 60;
  speed = 1;
  paused = false;
  private acc = 0;
  /** Quantos passos de lógica foram feitos no último frame (debug). */
  lastSteps = 0;

  constructor(private step: (dt: number) => void) {}

  /** realDt em segundos. Retorna alpha de interpolação (não usado: render lê estado atual). */
  advance(realDt: number): void {
    this.lastSteps = 0;
    if (this.paused) return;
    this.acc += Math.min(realDt, 0.1) * this.speed;
    let n = 0;
    while (this.acc >= this.dt && n < 10) {
      this.step(this.dt);
      this.acc -= this.dt;
      n++;
    }
    if (n >= 10) this.acc = 0;
    this.lastSteps = n;
  }

  reset(): void {
    this.acc = 0;
  }
}
