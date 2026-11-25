"""Converte a arte antiga (HD, src/assets/sprites/*.webp) dos menus para pixel art.

  python scripts/pixelizar_menus.py            (todas as famílias da lista)
  python scripts/pixelizar_menus.py avatar_ bau_   (só esses prefixos)

Para cada imagem: reduz para 1/3 do tamanho (cor mais comum por célula, guardando os brilhos),
prende numa paleta própria de 64 cores, salva em src/assets/pixel/<id>.png (o jogo passa a usar a
pixel art no lugar) e apaga o .webp antigo (fica no histórico do git).
"""
from __future__ import annotations

import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pixelizar import paleta_propria, reduzir  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPR = os.path.join(RAIZ, "src", "assets", "sprites")
PX = os.path.join(RAIZ, "src", "assets", "pixel")

FAMILIAS = ["avatar_", "banner_", "bau_", "botao_batalha", "chip_", "escudo", "fase_", "logo", "loja_", "modo_",
            "moeda_", "patente_", "pedestal", "premio_", "talento_", "tile_"]
FATOR = 3


def main(argv: list[str]) -> int:
    familias = argv or FAMILIAS
    n = 0
    for arq in sorted(os.listdir(SPR)):
        nome, ext = os.path.splitext(arq)
        if ext != ".webp" or not any(nome.startswith(f) for f in familias):
            continue
        img = Image.open(os.path.join(SPR, arq)).convert("RGBA")
        k = FATOR
        nw, nh = max(1, round(img.width / k)), max(1, round(img.height / k))
        if max(nw, nh) < 48:  # coisas pequenas (moedas) não podem virar borrão de 20 px
            s = 48 / max(img.width, img.height)
            nw, nh = max(1, round(img.width * s)), max(1, round(img.height * s))
        peq = reduzir(img, nw, nh, brilhos=True)
        peq = paleta_propria(peq, 64)
        peq.save(os.path.join(PX, f"{nome}.png"), optimize=True)
        os.remove(os.path.join(SPR, arq))
        n += 1
        print(f"{nome}: {img.width}x{img.height} -> {nw}x{nh}")
    # molduras de carta antigas (as novas em pixel art já existem)
    for r in ("comum", "rara", "epica", "lendaria", "suprema"):
        p = os.path.join(SPR, f"moldura_{r}.webp")
        if os.path.exists(p) and os.path.exists(os.path.join(PX, f"moldura_{r}.png")):
            os.remove(p)
    print(f"{n} imagens convertidas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
