"""
Processa a arte gerada por IA (JPEG sem transparência) em sprites PNG prontos para o jogo.

Uso: python3 scripts/processar_arte.py            (processa tudo em arte/original/)
Saída: src/assets/sprites/<nome>.png

- Fundo preto: remove o preto ligado às bordas e faz o brilho das bordas sumir suavemente (sem halo escuro).
- Fundo xadrez "falso" (cinza/branco desenhado na imagem): remove por cor neutra clara ligada às bordas.
- Efeitos translúcidos (escudo): alfa = brilho do pixel (funciona com blend aditivo).
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "arte", "original")
SAIDA = os.path.join(RAIZ, "src", "assets", "sprites")

# nome -> (modo, tamanho final)
CONFIG = {
    "planeta_mapa": ("mapa", 1024),
    "planeta_nuvens": ("nuvens", 1024),
    "planeta": ("fundo", 512),
    "escudo": ("aditivo", 512),
    "sentinela_": ("fundo", 256),
    "inimigo_": ("fundo", 256),
    "chefe_": ("fundo", 512),
    "missil": ("fundo", 256),
    "drone": ("fundo", 128),
}


def dilatar(m):
    d = m.copy()
    d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    return d


def ligado_as_bordas(cand):
    """Flood fill: pixels candidatos conectados à borda da imagem."""
    sel = np.zeros_like(cand)
    sel[0, :] = cand[0, :]; sel[-1, :] = cand[-1, :]; sel[:, 0] = cand[:, 0]; sel[:, -1] = cand[:, -1]
    while True:
        novo = dilatar(sel) & cand
        if novo.sum() == sel.sum():
            return novo
        sel = novo


def remover_fundo(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(axis=2); mn = rgb.min(axis=2)
    canto = rgb[2:12, 2:12].reshape(-1, 3).mean(axis=0)
    if canto.mean() > 150:
        # xadrez falso: cinzas/brancos neutros e claros
        cand = (mx - mn < 22) & (mn > 175)
        fundo = ligado_as_bordas(cand)
        alfa = np.where(fundo, 0.0, 1.0)
        # limpa ilhas pequenas de xadrez presas no meio
        alfa_img = Image.fromarray((alfa * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
        alfa = np.asarray(alfa_img).astype(np.float32) / 255
    else:
        cand = mx < 30
        fundo = ligado_as_bordas(cand)
        alfa = np.where(fundo, 0.0, 1.0)
        # faixa de transição perto do fundo: alfa proporcional ao brilho (brilho some sem halo preto)
        faixa = fundo.copy()
        for _ in range(10):
            faixa = dilatar(faixa)
        faixa &= ~fundo
        suave = np.clip((mx.astype(np.float32) - 18) / 110, 0, 1)
        alfa = np.where(faixa, np.minimum(alfa, suave), alfa)
    a = np.clip(alfa, 0, 1)[..., None]
    cor = np.where(a > 0.02, np.clip(rgb / np.maximum(a, 0.02), 0, 255), 0)
    return np.dstack([cor, a[..., 0] * 255]).astype(np.uint8)


def aditivo(rgb):
    mx = rgb.max(axis=2).astype(np.float32)
    a = np.clip((mx - 8) / 230, 0, 1)
    cor = np.where(a[..., None] > 0.02, np.clip(rgb / np.maximum(a[..., None], 0.02), 0, 255), 0)
    return np.dstack([cor, a * 255]).astype(np.uint8)


def recortar_quadrado(img, margem=0.04):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    lado = max(x1 - x0, y1 - y0)
    lado = int(lado * (1 + margem * 2))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    out = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    out.paste(img.crop((cx - lado // 2, cy - lado // 2, cx - lado // 2 + lado, cy - lado // 2 + lado)), (0, 0))
    return out


def mapa_esfera(arq, nome, tam, nuvens):
    """Mapa equirretangular: redimensiona para 2:1 e funde as bordas esquerda/direita (sem emenda ao girar)."""
    im = Image.open(os.path.join(ORIG, arq)).convert("RGB").resize((tam, tam // 2), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    faixa = max(8, tam // 64)
    esq = a[:, :faixa].copy()
    dir_ = a[:, -faixa:].copy()
    for i in range(faixa):
        t = 0.5 * (1 - i / faixa)  # na borda, média das duas pontas; some para dentro
        a[:, i] = esq[:, i] * (1 - t) + dir_[:, -1] * t
        a[:, -1 - i] = dir_[:, -1 - i] * (1 - t) + esq[:, 0] * t
    if nuvens:
        alfa = np.clip((a.max(axis=2) - 60) / 195, 0, 1) ** 1.3 * 0.8  # mais leve: não esconde os continentes
        rgba = np.dstack([np.full(alfa.shape + (3,), 255.0), alfa * 255]).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(os.path.join(SAIDA, nome + ".png"), optimize=True)
        print(f"{nome}.png  {tam}x{tam // 2}  (nuvens: brilho vira transparência)")
    else:
        Image.fromarray(a.astype(np.uint8)).save(os.path.join(SAIDA, nome + ".jpg"), quality=90)
        print(f"{nome}.jpg  {tam}x{tam // 2}  (mapa da esfera)")


def processar(arq):
    nome = os.path.splitext(arq)[0]
    modo, tam = next((v for k, v in CONFIG.items() if nome.startswith(k)), ("fundo", 256))
    if modo in ("mapa", "nuvens"):
        return mapa_esfera(arq, nome, tam, modo == "nuvens")
    src = Image.open(os.path.join(ORIG, arq)).convert("RGB")
    rgb = np.asarray(src).astype(np.float32)
    rgba = aditivo(rgb) if modo == "aditivo" else remover_fundo(rgb)
    img = Image.fromarray(rgba, "RGBA")
    # sentinelas mantêm o centro da base hexagonal no centro do sprite (o cano sai para a direita)
    img = recortar_quadrado(img, 0.02 if nome in ("planeta", "escudo") else 0.04)
    img = img.resize((tam, tam), Image.LANCZOS)
    img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
    print(f"{nome}.png  {tam}x{tam}  ({modo})")


if __name__ == "__main__":
    os.makedirs(SAIDA, exist_ok=True)
    alvos = sys.argv[1:] or sorted(os.listdir(ORIG))
    for a in alvos:
        if a.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            processar(a)
