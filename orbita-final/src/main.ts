import { Application } from "pixi.js";
import "./style.css";
import { Game } from "./core/Game";
import { carregarSprites } from "./render/Sprites";

async function main(): Promise<void> {
  const app = new Application();
  await app.init({
    background: "#05070f",
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    powerPreference: "high-performance",
    width: window.innerWidth,
    height: window.innerHeight,
  });
  document.getElementById("game")!.appendChild(app.canvas);
  await carregarSprites();
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
}

void main();
