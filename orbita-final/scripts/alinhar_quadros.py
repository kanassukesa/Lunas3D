"""Alinha os quadros de animação de um chefe pelo CORPO (para ele não "pular" ao piscar ou atacar).

  python scripts/alinhar_quadros.py chefe_colosso_igneo

Usa src/assets/pixel/<chefe>.png como referência e alinha todos os <chefe>_*.png:
procura o deslocamento em que o desenho do quadro mais se sobrepõe ao da referência
(só a parte de cima, onde fica o corpo; a de baixo pode ter tiro/jato de fogo), e coloca
todos numa tela do mesmo tamanho com o corpo da referência no centro (pivô do sprite).
"""
from __future__ import annotations

import glob
import json
import os
import sys

import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIXEL = os.path.join(RAIZ, "src", "assets", "pixel")


def recortar(im: Image.Image) -> Image.Image:
    caixa = im.getchannel("A").getbbox()
    return im.crop(caixa) if caixa else im


def melhor_encaixe(ref: np.ndarray, q: np.ndarray, busca: int = 24) -> tuple[int, int]:
    """(dx, dy) da posição de q (canto) em relação à ref que mais sobrepõe a metade de cima da ref."""
    rh, rw = ref.shape
    topo = ref[: int(rh * 0.6)]
    melhor, ond = -1.0, (0, 0)
    for dy in range(-busca, busca + 1):
        for dx in range(-busca, busca + 1):
            # recorte de q que cai em cima de "topo"
            y0, x0 = max(0, dy), max(0, dx)
            y1, x1 = min(topo.shape[0], dy + q.shape[0]), min(rw, dx + q.shape[1])
            if y1 <= y0 or x1 <= x0:
                continue
            a = topo[y0:y1, x0:x1]
            b = q[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
            inter = np.logical_and(a, b).sum()
            uniao = topo.sum() + b.sum() - inter
            v = inter / max(1, uniao)
            if v > melhor:
                melhor, ond = v, (dx, dy)
    return ond


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    chefe = argv[0]
    ref_img = recortar(Image.open(os.path.join(PIXEL, f"{chefe}.png")).convert("RGBA"))
    ref = np.asarray(ref_img)[..., 3] > 0
    quadros = {chefe: (ref_img, (0, 0))}
    for p in sorted(glob.glob(os.path.join(PIXEL, f"{chefe}_*.png"))):
        nome = os.path.splitext(os.path.basename(p))[0]
        im = recortar(Image.open(p).convert("RGBA"))
        quadros[nome] = (im, melhor_encaixe(ref, np.asarray(im)[..., 3] > 0))
    # tela comum com o centro do corpo da referência no meio
    cx, cy = ref_img.width / 2, ref_img.height / 2
    ext = 0.0
    for im, (dx, dy) in quadros.values():
        ext = max(ext, abs(dx - cx), abs(dx + im.width - cx), abs(dy - cy), abs(dy + im.height - cy))
    lado = int(np.ceil(ext)) * 2 + 2
    for nome, (im, (dx, dy)) in quadros.items():
        tela = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        tela.alpha_composite(im, (int(round(lado / 2 - cx + dx)), int(round(lado / 2 - cy + dy))))
        tela.save(os.path.join(PIXEL, f"{nome}.png"), optimize=True)
        print(f"{nome}: deslocamento ({dx:+d}, {dy:+d}) -> tela {lado}x{lado}")
    # largura do CORPO (o jogo usa para o tamanho do chefe, já que a tela ficou maior com folga)
    meta_p = os.path.join(PIXEL, "chefes.json")
    meta = json.load(open(meta_p, encoding="utf-8")) if os.path.exists(meta_p) else {}
    meta[chefe] = ref_img.width
    json.dump(meta, open(meta_p, "w", encoding="utf-8"), indent=1, sort_keys=True)
    print(f"corpo: {ref_img.width}px (salvo em chefes.json)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
