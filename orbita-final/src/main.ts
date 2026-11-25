import { carregarFx } from "./render/EfeitosFx";
import { Application } from "pixi.js";
import "./style.css";
import "./ui/hud-pixel.css";
import "./ui/pixel-ui.css";
import { Game } from "./core/Game";
import { carregarSprites } from "./render/Sprites";
import { prebaixarArtes, retentarImagens } from "./core/Atualizacao";
import { noApk } from "./core/Nuvem";

async function main(): Promise<void> {
  retentarImagens();
  const app = new Application();
  await app.init({
    background: "#05070f",
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    powerPreference: "high-performance",
    // o planeta 3D usa shader GLSL: força WebGL (padrão no iPhone de qualquer forma)
    preference: "webgl",
    width: window.innerWidth,
    height: window.innerHeight,
  });
  document.getElementById("game")!.appendChild(app.canvas);
  await Promise.all([carregarSprites(), carregarFx()]);
  const game = new Game(app);
  game.init();
  (window as unknown as { game: Game }).game = game;

  // evita zoom por gesto/duplo toque no iOS
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  let ultimoToque = 0;
  document.addEventListener("touchend", (e) => {
    const agora = Date.now();
    if (agora - ultimoToque < 300) e.preventDefault();
    ultimoToque = agora;
  }, { passive: false });

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
  // imagens no aparelho com antecedência: no APK todas; no site só as cartas (as do menu já carregaram)
  window.setTimeout(() => void prebaixarArtes(noApk()), 6000);
}

void main();
