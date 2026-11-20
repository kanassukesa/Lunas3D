// Gera os ícones PWA desenhando num canvas via Playwright (Chromium pré-instalado).
const { chromium } = require("playwright");
const { writeFileSync } = require("node:fs");
(async () => {
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [180, 192, 512]) {
  const data = await page.evaluate((S) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, "#05070f"); bg.addColorStop(1, "#0b1630");
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S * 0.55, R = S * 0.24;
    g.strokeStyle = "rgba(79,214,255,0.5)"; g.lineWidth = S * 0.015;
    g.beginPath(); g.ellipse(cx, cy, R * 1.75, R * 0.55, -0.35, 0, Math.PI * 2); g.stroke();
    const p = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    p.addColorStop(0, "#7fe0ff"); p.addColorStop(0.55, "#1f6fc8"); p.addColorStop(1, "#0a2350");
    g.shadowColor = "#4fd6ff"; g.shadowBlur = S * 0.08;
    g.fillStyle = p; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    for (const [a, col] of [[-2.4, "#ff9a3c"], [-0.7, "#7df9ff"], [0.6, "#ffd25e"]]) {
      const x = cx + Math.cos(a) * R * 1.75 * 0.98, y = cy + Math.sin(a) * R * 0.55;
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = S * 0.05;
      g.beginPath(); g.arc(x, y, S * 0.035, 0, Math.PI * 2); g.fill();
    }
    g.shadowBlur = 0; g.fillStyle = "#ff6b4a";
    g.beginPath(); g.moveTo(S * 0.28, S * 0.12); g.lineTo(S * 0.36, S * 0.2); g.lineTo(S * 0.24, S * 0.2); g.fill();
    return c.toDataURL("image/png");
  }, size);
  writeFileSync(`public/icons/icon-${size}.png`, Buffer.from(data.split(",")[1], "base64"));
}
await browser.close();
console.log("ícones gerados");
})();
