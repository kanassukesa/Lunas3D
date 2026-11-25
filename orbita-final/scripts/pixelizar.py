"""Limpa pixel art gerado por IA (ChatGPT etc.) para o jogo.

O que faz, em ordem:
  1. Acha a grade de pixels (o tamanho do "pixel grande") ou usa --tam LxA.
  2. Reduz para o tamanho nativo pegando a cor mais comum de cada célula
     (sem borrar: cada célula vira 1 pixel).
  3. Prende as cores na paleta do estilo (--paleta estilo) ou numa paleta
     enxuta própria da imagem (--cores N).
  4. (--sem-fundo) O preto puro ligado às bordas vira transparente; contornos
     escuros dentro do objeto ficam.
  5. Corta a margem transparente (--recortar) e salva PNG no tamanho nativo.
     No jogo a textura é ampliada com filtro "nearest".

Exemplos:
  python scripts/pixelizar.py fundo_1.png public/sprites/pixel/fundo_1.png --tam 180x320
  python scripts/pixelizar.py inimigo.png saida.png --sem-fundo --recortar --previa 6
  python scripts/pixelizar.py planeta_mapa.png saida.png --tam 256x128 --cores 32
"""
from __future__ import annotations

import argparse
import sys
from collections import deque

import numpy as np
from PIL import Image

# Paleta da "Mensagem 0" (arte/PIXEL_01_FUNDO_PLANETA.md) + preto e branco.
PALETA_ESTILO = """
05070F 0B0E1F 141A3A 1E2A5C 2D1F4F 4A2F7A
2A6FD6 3FD0FF 9FF0FF F4F8FF
3A4258 5B6582 8F9BB8 C9D2E6
1F6B3A 4CD96A 2B4FB8 E8D9A8
E0394B FF7A3C FFD04A D94FD0 7DFF6B
A86A00 FFC23D FFE7A0
000000 FFFFFF
""".split()


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.strip().lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


# ----------------------------------------------------------------- grade

def _erro_grade(rgb: np.ndarray, k: float) -> float:
    """Erro médio ao reduzir pela grade k (amostra no centro) e ampliar de volta."""
    h, w, _ = rgb.shape
    nw, nh = max(1, round(w / k)), max(1, round(h / k))
    xs = np.minimum(((np.arange(nw) + 0.5) * w / nw).astype(int), w - 1)
    ys = np.minimum(((np.arange(nh) + 0.5) * h / nh).astype(int), h - 1)
    peq = rgb[ys][:, xs]
    bx = np.minimum((np.arange(w) * nw / w).astype(int), nw - 1)
    by = np.minimum((np.arange(h) * nh / h).astype(int), nh - 1)
    volta = peq[by][:, bx]
    return float(np.abs(volta.astype(np.int16) - rgb.astype(np.int16)).mean())


def _periodo(sinal: np.ndarray, kmax: float) -> tuple[float, float]:
    """Tamanho do pixel num eixo, pelas posições das bordas. Devolve (período, nota).

    Toda borda cai num múltiplo do tamanho real do pixel (k). Períodos k/2, k/3
    também encaixam todas as bordas; 2k só encaixa metade. Então o tamanho é o
    MAIOR período que ainda encaixa quase todas as bordas.
    """
    s = np.asarray(sinal, np.float64)
    pico = (s[1:-1] >= s[:-2]) & (s[1:-1] >= s[2:]) & (s[1:-1] > s.max() * 0.2)
    idx = np.nonzero(pico)[0] + 1
    if len(idx) < 4:
        return 1.0, 0.0
    # posição sub-pixel do pico (parábola) e +0.5 porque diff fica entre pixels
    a, b, c = s[idx - 1], s[idx], s[idx + 1]
    den = a - 2 * b + c
    bordas = idx + 0.5 + np.where(den != 0, 0.5 * (a - c) / np.where(den != 0, den, 1), 0)
    peso = s[idx]
    fases = bordas[np.argsort(-peso)[:24]]
    tol = 1.0
    melhor_p, melhor_n, melhor_f = 1.0, 0.0, 0.0
    for p in np.arange(2.0, kmax + 0.001, 0.01):
        d = (bordas[None, :] - fases[:, None]) % p
        d = np.minimum(d, p - d)
        notas = ((d <= tol) * peso).sum(1)
        i = int(notas.argmax())
        if notas[i] / peso.sum() >= 0.85:
            melhor_p, melhor_n, melhor_f = float(p), float(notas[i] / peso.sum()), float(fases[i])
    if melhor_n == 0:
        return melhor_p, melhor_n
    # refino: reta (mínimos quadrados) passando pelas bordas que encaixaram
    for _ in range(3):
        n = np.round((bordas - melhor_f) / melhor_p)
        ok = np.abs(bordas - (melhor_f + n * melhor_p)) <= tol
        if ok.sum() < 3 or np.ptp(n[ok]) == 0:
            break
        melhor_p, melhor_f = np.polyfit(n[ok], bordas[ok], 1, w=peso[ok])
    return float(melhor_p), melhor_n


def achar_grade(rgb: np.ndarray, kmax: int = 32) -> float:
    """Tamanho do pixel grande, achado pelo espaçamento das bordas entre cores."""
    lum = rgb.astype(np.float32) @ np.array([0.3, 0.59, 0.11], np.float32)
    bx = np.abs(np.diff(lum, axis=1)).sum(0)
    by = np.abs(np.diff(lum, axis=0)).sum(1)
    px, nx = _periodo(bx, kmax)
    py, ny = _periodo(by, kmax)
    # os dois eixos deveriam concordar; se não, vale o de nota maior
    if abs(px - py) / max(px, py) < 0.08:
        return (px + py) / 2
    return px if nx >= ny else py


# ----------------------------------------------------------------- reduzir

def reduzir(img: Image.Image, nw: int, nh: int, brilhos: bool = False) -> Image.Image:
    """Cada célula vira a cor mais comum dela (o miolo da célula pesa mais).

    brilhos=True: se a célula tem um ponto bem mais claro que a cor comum
    (estrela menor que a célula), a célula vira esse ponto claro.
    """
    a = np.asarray(img.convert("RGBA"))
    h, w, _ = a.shape
    saida = np.zeros((nh, nw, 4), np.uint8)
    x0 = (np.arange(nw + 1) * w / nw).round().astype(int)
    y0 = (np.arange(nh + 1) * h / nh).round().astype(int)
    for j in range(nh):
        for i in range(nw):
            xa, xb, ya, yb = x0[i], x0[i + 1], y0[j], y0[j + 1]
            # ignora 20% da borda da célula (onde a IA borra a transição)
            mx, my = (xb - xa) // 5, (yb - ya) // 5
            cel = a[ya + my:max(yb - my, ya + my + 1), xa + mx:max(xb - mx, xa + mx + 1)].reshape(-1, 4)
            # arredonda para juntar cores quase iguais (ruído de JPEG)
            q = (cel >> 3).astype(np.int32)
            chave = (q[:, 0] << 15) | (q[:, 1] << 10) | (q[:, 2] << 5) | (q[:, 3] >> 0)
            vals, cont = np.unique(chave, return_counts=True)
            alvo = vals[cont.argmax()]
            cor = cel[chave == alvo].mean(axis=0)
            if brilhos:
                tudo = a[ya:yb, xa:xb].reshape(-1, 4).astype(np.float32)
                lum = tudo[:, :3] @ np.array([0.3, 0.59, 0.11], np.float32)
                lc = float(cor[:3] @ np.array([0.3, 0.59, 0.11]))
                if lum.max() > lc + 45:
                    cor = tudo[lum >= lum.max() - 20].mean(axis=0)
            saida[j, i] = np.asarray(cor).round()
    return Image.fromarray(saida, "RGBA")


# ----------------------------------------------------------------- paleta

def _lin(c: np.ndarray) -> np.ndarray:
    """RGB -> espaço aproximadamente perceptual (pesos de luminância)."""
    return c.astype(np.float32) * np.array([0.30, 0.59, 0.11], np.float32) ** 0.5


def prender_paleta(img: Image.Image, paleta: list[tuple[int, int, int]]) -> Image.Image:
    a = np.asarray(img.convert("RGBA")).copy()
    pal = np.array(paleta, np.uint8)
    px = a[..., :3].reshape(-1, 3)
    d = ((_lin(px)[:, None, :] - _lin(pal)[None, :, :]) ** 2).sum(-1)
    a[..., :3] = pal[d.argmin(1)].reshape(a.shape[:2] + (3,))
    return Image.fromarray(a, "RGBA")


def paleta_propria(img: Image.Image, n: int) -> Image.Image:
    rgba = img.convert("RGBA")
    alfa = rgba.getchannel("A")
    q = rgba.convert("RGB").quantize(colors=n, method=Image.Quantize.MAXCOVERAGE, kmeans=4, dither=Image.Dither.NONE)
    out = q.convert("RGBA")
    out.putalpha(alfa)
    return out


# ----------------------------------------------------------------- fundo

def tirar_fundo(img: Image.Image, limiar: int = 18) -> Image.Image:
    """Preto (quase puro) ligado às bordas vira transparente."""
    a = np.asarray(img.convert("RGBA")).copy()
    h, w, _ = a.shape
    escuro = a[..., :3].max(-1) <= limiar
    visto = np.zeros((h, w), bool)
    fila = deque()
    for x in range(w):
        for y in (0, h - 1):
            if escuro[y, x] and not visto[y, x]:
                visto[y, x] = True; fila.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if escuro[y, x] and not visto[y, x]:
                visto[y, x] = True; fila.append((y, x))
    while fila:
        y, x = fila.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and escuro[ny, nx] and not visto[ny, nx]:
                visto[ny, nx] = True; fila.append((ny, nx))
    a[visto, 3] = 0
    a[visto, :3] = 0
    return Image.fromarray(a, "RGBA")


def recortar(img: Image.Image, margem: int = 1) -> Image.Image:
    caixa = img.getchannel("A").getbbox()
    if not caixa:
        return img
    x0, y0, x1, y1 = caixa
    return img.crop((max(0, x0 - margem), max(0, y0 - margem), min(img.width, x1 + margem), min(img.height, y1 + margem)))


# ----------------------------------------------------------------- main

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("entrada")
    p.add_argument("saida")
    p.add_argument("--tam", help="tamanho nativo LxA (ex.: 180x320). Sem isso, acha a grade sozinho")
    p.add_argument("--grade", type=float, help="força o tamanho do pixel grande (ex.: 6)")
    p.add_argument("--paleta", default="estilo", help="'estilo' (padrão), 'nenhuma' ou lista de hex separada por vírgula")
    p.add_argument("--cores", type=int, help="usa paleta própria da imagem com N cores (em vez da do estilo)")
    p.add_argument("--brilhos", action="store_true", help="preserva estrelas/pontos de luz menores que a célula")
    p.add_argument("--sem-fundo", action="store_true", help="preto ligado às bordas vira transparente")
    p.add_argument("--recortar", action="store_true", help="corta a margem transparente")
    p.add_argument("--previa", type=int, default=0, help="também salva uma prévia ampliada Nx (nearest)")
    a = p.parse_args(argv)

    img = Image.open(a.entrada).convert("RGBA")
    if a.tam:
        nw, nh = (int(v) for v in a.tam.lower().split("x"))
        k = img.width / nw
    else:
        k = a.grade or achar_grade(np.asarray(img.convert("RGB")))
        nw, nh = max(1, round(img.width / k)), max(1, round(img.height / k))
    peq = reduzir(img, nw, nh, a.brilhos) if (nw, nh) != img.size else img

    if a.cores:
        peq = paleta_propria(peq, a.cores)
    elif a.paleta != "nenhuma":
        pal = PALETA_ESTILO if a.paleta == "estilo" else a.paleta.split(",")
        peq = prender_paleta(peq, [hex_rgb(c) for c in pal])

    if a.sem_fundo:
        peq = tirar_fundo(peq)
    if a.recortar:
        peq = recortar(peq)

    peq.save(a.saida, optimize=True)
    cores = len({tuple(c) for c in np.asarray(peq).reshape(-1, 4) if c[3] > 0})
    print(f"{a.entrada}: {img.width}x{img.height} -> {peq.width}x{peq.height} (pixel ~{k:.2f}), {cores} cores -> {a.saida}")
    if a.previa:
        prev = a.saida.rsplit(".", 1)[0] + f"_previa{a.previa}x.png"
        peq.resize((peq.width * a.previa, peq.height * a.previa), Image.Resampling.NEAREST).save(prev)
        print(f"  prévia: {prev}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
