import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { tex } from "./Textures";
import { ehPixel, temArte } from "./Sprites";

/** Fundo espacial: gradiente + nebulosa + 3 camadas de estrelas com parallax. */
export class Background {
  readonly layer = new Container();
  private neb: Sprite;
  private camadas: { s: TilingSprite; vel: number }[] = [];
  private img: Sprite | null = null;
  private w = 1;
  private h = 1;
  /** Fundo em pixel art: imagem original e a versão estendida para o formato da tela. */
  private pixelBase: Texture | null = null;
  private pixelExt: Texture | null = null;
  private pixelChave = "";

  constructor() {
    this.neb = new Sprite(tex("nebulosa"));
    this.layer.addChild(this.neb);
    this.img = new Sprite();
    this.img.anchor.set(0.5);
    this.img.visible = false;
    this.layer.addChild(this.img);
    const ids: [string, number][] = [["estrelas1", 6], ["estrelas2", 16], ["estrelas3", 34]];
    for (const [id, vel] of ids) {
      const s = new TilingSprite({ texture: tex(id), width: 100, height: 100 });
      this.layer.addChild(s);
      this.camadas.push({ s, vel });
    }
    this.setFundo(1);
  }

  /** Troca a imagem de fundo (fundo_1..3 da arte final). */
  setFundo(n: number): void {
    const id = `fundo_${n}`;
    if (!this.img || !temArte(id)) return;
    this.img.visible = true;
    if (ehPixel(id)) {
      this.pixelBase = tex(id);
      this.pixelChave = "";
    } else {
      this.pixelBase = null;
      this.img.texture = tex(id);
    }
    // as estrelas procedurais ficam por cima, mais discretas, só para dar o parallax
    // (no fundo em pixel art elas somem: são lisas e não combinam com os pixels)
    const pixel = ehPixel(id);
    this.neb.visible = !pixel;
    this.camadas.forEach((c, i) => { c.s.alpha = 0.35 + i * 0.2; c.s.visible = !pixel; });
    this.ajustarImg();
  }

  private ajustarImg(): void {
    const im = this.img;
    if (!im || !im.visible) return;
    if (this.pixelBase) {
      // pixel art: a imagem inteira cabe na tela (sem zoom cortando) e as sobras viram mais espaço
      const b = this.pixelBase;
      const k = Math.min(this.w / b.width, this.h / b.height);
      const W = Math.max(b.width, Math.ceil(this.w / k));
      const H = Math.max(b.height, Math.ceil(this.h / k));
      const chave = `${b.uid}:${W}x${H}`;
      if (chave !== this.pixelChave) {
        this.pixelChave = chave;
        const antiga = this.pixelExt;
        this.pixelExt = W === b.width && H === b.height ? null : estenderFundo(b, W, H);
        im.texture = this.pixelExt ?? b;
        antiga?.destroy(true);
      }
      im.scale.set(k);
      im.position.set(Math.round(this.w / 2), Math.round(this.h / 2));
      return;
    }
    const k = Math.max(this.w / im.texture.width, this.h / im.texture.height);
    im.scale.set(k);
    im.position.set(this.w / 2, this.h / 2);
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.ajustarImg();
    this.neb.width = w;
    this.neb.height = h;
    const k = Math.max(w / 540, h / 960);
    for (const c of this.camadas) {
      c.s.width = w;
      c.s.height = h;
      c.s.tileScale.set(Math.max(1, k * 0.6));
    }
  }

  update(dt: number, mult = 1): void {
    for (const c of this.camadas) c.s.tilePosition.y += c.vel * dt * mult;
  }
}

/**
 * Estende um fundo em pixel art para W x H pixels sem distorcer: a imagem fica no meio,
 * as bordas continuam a cor dela (sem as estrelas) e vão escurecendo para a cor do espaço,
 * e a área nova ganha estrelas do mesmo tipo das que existem na imagem.
 */
function estenderFundo(base: Texture, W: number, H: number): Texture {
  const iw = base.width, ih = base.height;
  const cv0 = document.createElement("canvas");
  cv0.width = iw; cv0.height = ih;
  const c0 = cv0.getContext("2d")!;
  c0.drawImage(base.source.resource as CanvasImageSource, 0, 0, iw, ih);
  const src = c0.getImageData(0, 0, iw, ih).data;
  const lum = (i: number) => src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11;

  // cor do "espaço vazio": a mais comum da imagem
  const conta = new Map<number, number>();
  for (let i = 0; i < src.length; i += 4) {
    const k = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
    conta.set(k, (conta.get(k) ?? 0) + 1);
  }
  let espaco = 0, max = 0;
  for (const [k, n] of conta) if (n > max) { max = n; espaco = k; }
  const er = espaco >> 16, eg = (espaco >> 8) & 255, eb = espaco & 255;
  const lumEsp = er * 0.3 + eg * 0.59 + eb * 0.11;

  // estrelas da imagem: pixels bem mais claros que o espaço (cores e densidade)
  const estrelas: number[] = [];
  for (let i = 0; i < src.length; i += 4) if (lum(i) > lumEsp + 70) estrelas.push(i);
  const densidade = estrelas.length / (iw * ih);

  // cor da borda sem as estrelas (média do que não é ponto claro numa faixa)
  const corBorda = (x: number, y: number): [number, number, number] => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = Math.min(iw - 1, Math.max(0, x + dx)), yy = Math.min(ih - 1, Math.max(0, y + dy));
      const i = (yy * iw + xx) * 4;
      if (lum(i) > lumEsp + 45) continue;
      r += src[i]; g += src[i + 1]; b += src[i + 2]; n++;
    }
    return n ? [r / n, g / n, b / n] : [er, eg, eb];
  };

  const ox = Math.floor((W - iw) / 2), oy = Math.floor((H - ih) / 2);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  const out = ctx.createImageData(W, H);
  const d = out.data;
  const FAIXA = 28; // pixels até virar só a cor do espaço
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = x - ox, sy = y - oy;
      const o = (y * W + x) * 4;
      if (sx >= 0 && sy >= 0 && sx < iw && sy < ih) {
        const i = (sy * iw + sx) * 4;
        d[o] = src[i]; d[o + 1] = src[i + 1]; d[o + 2] = src[i + 2]; d[o + 3] = 255;
        continue;
      }
      const cx = Math.min(iw - 1, Math.max(0, sx)), cy = Math.min(ih - 1, Math.max(0, sy));
      const dist = Math.max(Math.abs(sx - cx), Math.abs(sy - cy));
      const [br, bg, bb] = corBorda(cx, cy);
      // degraus (sem gradiente liso, para continuar pixel art)
      const t = Math.min(1, Math.ceil((dist / FAIXA) * 4) / 4);
      d[o] = br + (er - br) * t; d[o + 1] = bg + (eg - bg) * t; d[o + 2] = bb + (eb - bb) * t; d[o + 3] = 255;
    }
  }
  // estrelas novas na área estendida (sorteio fixo: a tela não "pisca" ao redimensionar)
  let semente = 1234567;
  const rnd = () => ((semente = (Math.imul(semente, 1103515245) + 12345) >>> 0) / 4294967296);
  if (estrelas.length) {
    const novas = Math.round(densidade * (W * H - iw * ih));
    for (let n = 0; n < novas * 4 && n < 20000; n++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
      const i = estrelas[Math.floor(rnd() * estrelas.length)];
      if (x >= ox - 1 && y >= oy - 1 && x <= ox + iw && y <= oy + ih) continue; // só fora da imagem
      if (rnd() > 0.25) continue;
      const o = (y * W + x) * 4;
      d[o] = src[i]; d[o + 1] = src[i + 1]; d[o + 2] = src[i + 2];
    }
  }
  ctx.putImageData(out, 0, 0);
  const t = Texture.from(cv);
  t.source.scaleMode = "nearest";
  return t;
}
