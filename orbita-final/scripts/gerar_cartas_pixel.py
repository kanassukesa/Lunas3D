"""Gera as artes das CARTAS de arma (e as imagens do Hangar) em pixel art a partir dos sprites do jogo.

  python scripts/gerar_cartas_pixel.py

Para cada arma:
  carta_<id>.png      carta normal: fundo de estrelas + brilho na cor da arma + torre no estágio 1
  carta_evo_<id>.png  carta de evolução: torre no estágio 4 (dourada) + moldura dourada
  sentinela_<id>.png  imagem quadrada (Hangar, telas): torre no estágio 1
As armas do planeta (Domo, Serra, Colmeia) usam a instalação em vez da torre.
Saída: src/assets/pixel (substitui a arte antiga de mesmo nome no jogo).
"""
from __future__ import annotations

import os
import re

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PX = os.path.join(RAIZ, "src", "assets", "pixel")
INSTALACOES = {"campo", "serra", "drone"}
# brilho em anéis atrás do desenho (desligado: o dono preferiu sem)
BRILHO = False
# as cartas saem no dobro da resolução: fundo e torres ampliados 2x (pixels inteiros), desenhos de bônus já em 128 px
ESCALA = 2


def cores_das_armas() -> dict[str, tuple[int, int, int]]:
    s = open(os.path.join(RAIZ, "src", "data", "sentinels.ts"), encoding="utf-8").read()
    out = {}
    for m in re.finditer(r'^  (\w+): \{\s*\n\s*id: "(\w+)",.*?cor: 0x([0-9a-fA-F]{6})', s, re.S | re.M):
        c = m.group(3)
        out[m.group(2)] = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))
    return out


def fundo(w: int, h: int, cor: tuple[int, int, int], semente: int) -> Image.Image:
    """Recorte de um fundo da batalha (estrelas em pixel art) + brilho em anéis na cor da arma."""
    src = Image.open(os.path.join(PX, f"fundo_{1 + semente % 3}.png")).convert("RGBA")
    x0 = (semente * 37) % max(1, src.width - w)
    y0 = 60 + (semente * 53) % max(1, src.height - h - 120)
    img = src.crop((x0, y0, x0 + w, y0 + h))
    # brilho em degraus (pixel art: sem degradê liso)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    cx, cy = w // 2, int(h * 0.55)
    for raio, a in ((int(h * 0.48), 34), (int(h * 0.36), 52), (int(h * 0.24), 70)):
        d.ellipse((cx - raio, cy - raio, cx + raio, cy + raio), fill=cor + (a,))
    if BRILHO:
        img.alpha_composite(glow)
    return img


def recortar(im: Image.Image) -> Image.Image:
    caixa = im.getchannel("A").getbbox()
    return im.crop(caixa) if caixa else im


def torre(arma: str, estagio: int) -> Image.Image:
    """Base + cabeça (ou instalação) já montadas, recortadas."""
    if arma in INSTALACOES:
        return recortar(Image.open(os.path.join(PX, f"instalacao_{arma}_{estagio}.png")).convert("RGBA"))
    base = Image.open(os.path.join(PX, f"torre_base_{estagio}.png")).convert("RGBA")
    cab = Image.open(os.path.join(PX, f"arma_{arma}_{estagio}.png")).convert("RGBA")
    L = max(base.width, cab.width)
    A = max(base.height, cab.height)
    tela = Image.new("RGBA", (L, A), (0, 0, 0, 0))
    tela.alpha_composite(base, ((L - base.width) // 2, (A - base.height) // 2))
    tela.alpha_composite(cab, ((L - cab.width) // 2, (A - cab.height) // 2))
    return recortar(tela)


def moldura_dourada(img: Image.Image) -> None:
    d = ImageDraw.Draw(img)
    w, h = img.size
    for i, c in enumerate([(120, 74, 0, 255), (255, 194, 61, 255), (255, 231, 160, 255)]):
        d.rectangle((i, i, w - 1 - i, h - 1 - i), outline=c)


def compor(arma: str, cor, estagio: int, w: int, h: int, semente: int, evo: bool) -> Image.Image:
    img = fundo(w // ESCALA, h // ESCALA, (255, 194, 61) if evo else cor, semente)
    img = img.resize((w, h), Image.Resampling.NEAREST)
    t = torre(arma, estagio)
    t = t.resize((t.width * ESCALA, t.height * ESCALA), Image.Resampling.NEAREST)
    # cabe no cartão sem reduzir pixels: se for grande demais, corta as pontas (raro)
    x = (w - t.width) // 2
    y = (h - t.height) // 2 + (4 if arma in INSTALACOES else 2)
    img.alpha_composite(t, (x, max(-4, y)))
    if evo:
        moldura_dourada(img)
    return img


# cartas de bônus: desenho (arte/pixel_cartas/<motivo>.png, separado das folhas 8A) + cor do brilho
BONUS = {
    "dano": 0xFF7A3C, "cadencia": 0xFFD25E, "crit": 0xFF4D6D, "radar": 0x4FD6FF, "velocidade": 0x7DF9FF,
    "area": 0xFFA040, "dados": 0xA46BFF, "vidro": 0x9FE8FF, "hp": 0x49E07A, "cura": 0x49E07A,
    "escudo": 0x4FD6FF, "armadura": 0x9AA4B8, "espinhos": 0x5EC8FF, "estilhaco": 0xFFD25E, "ricochete": 0x7DF9FF,
    "queima": 0xFF7A2C, "veneno": 0x7DFF6B, "explosao": 0xFFA040, "perfurante": 0xB8F2FF, "executor": 0xFF4D5E,
    "ultimate": 0xFFC23D, "passiva": 0xB36BFF,
}


def cartas_bonus() -> int:
    pasta = os.path.join(RAIZ, "arte", "pixel_cartas")
    n = 0
    for i, (motivo, c) in enumerate(BONUS.items()):
        f = os.path.join(pasta, f"{motivo}.png")
        if not os.path.exists(f):
            continue
        cor = ((c >> 16) & 255, (c >> 8) & 255, c & 255)
        img = fundo(144, 96, cor, i + 11).resize((288, 192), Image.Resampling.NEAREST)
        ic = recortar(Image.open(f).convert("RGBA"))
        img.alpha_composite(ic, ((288 - ic.width) // 2, (192 - ic.height) // 2 + 2))
        img.save(os.path.join(PX, f"carta_{motivo}.png"), optimize=True)
        n += 1
    return n


def main() -> int:
    cores = cores_das_armas()
    feitos = 0
    for i, (arma, cor) in enumerate(sorted(cores.items())):
        if not os.path.exists(os.path.join(PX, f"instalacao_{arma}_1.png" if arma in INSTALACOES else f"arma_{arma}_1.png")):
            print(f"{arma}: sem sprite, pulei")
            continue
        compor(arma, cor, 1, 288, 192, i, False).save(os.path.join(PX, f"carta_{arma}.png"), optimize=True)
        compor(arma, cor, 4, 288, 192, i + 7, True).save(os.path.join(PX, f"carta_evo_{arma}.png"), optimize=True)
        compor(arma, cor, 1, 192, 192, i + 3, False).save(os.path.join(PX, f"sentinela_{arma}.png"), optimize=True)
        feitos += 1
    print(f"{feitos} armas -> {feitos * 3} imagens em src/assets/pixel")
    print(f"{cartas_bonus()} cartas de bônus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
