"""Separa uma folha 2x2 do ChatGPT (4 estágios de uma arma) em 4 sprites de pixel art.

  python scripts/fatiar_folha.py arma_canhao.png            -> src/assets/pixel/arma_canhao_1..4.png
  python scripts/fatiar_folha.py drone_colmeia.png --escala 13

Ordem da folha: [1 2 / 3 4] (em cima: estágios 1 e 2; embaixo: 3 e 4).

Folha de COISAS DIFERENTES (ex.: 4 inimigos): --nomes a,b,c,d --tamanhos 45,28,41,54
  cada quadro vira <nome>.png, com o maior lado do desenho reduzido para o tamanho pedido
  (use "-" no nome para pular um quadro vazio).

O ChatGPT não respeita a grade exata (um desenho invade o quadro do vizinho), então cada
estágio é achado pelos PEDAÇOS do desenho: cada pedaço separado (corpo, faísca, bolha...)
vai para o quadro onde fica o centro dele. Depois:
  - recorta o desenho e reduz por um fator FIXO (--escala, pixels da imagem por pixel de jogo),
    assim os 4 estágios e todas as armas ficam na mesma resolução;
  - limpa (cor mais comum por célula, poucas cores) e o preto vira transparente;
  - centraliza os 4 estágios numa tela do MESMO tamanho (o centro é o pivô de giro).
"""
from __future__ import annotations

import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pixelizar import paleta_propria, reduzir, tirar_fundo  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "src", "assets", "pixel")


def separar_estagios(img: Image.Image, limiar: int = 28, cols: int = 2, lins: int = 2) -> list[tuple[int, int, int, int] | None]:
    """Caixa (x0, y0, x1, y1) do desenho de cada estágio, pelos pedaços conectados."""
    W, H = img.size
    k = 4  # rótulo numa versão 4x menor (rápido)
    peq = np.asarray(img.convert("RGB").resize((W // k, H // k), Image.Resampling.BOX))
    m = peq.max(-1) > limiar
    h, w = m.shape
    rot = np.full((h, w), -1, np.int32)
    caixas: list[list[int] | None] = [None] * (cols * lins)
    pecas: list[tuple[int, float, float, list[int]]] = []
    for y0 in range(h):
        for x0 in range(w):
            if not m[y0, x0] or rot[y0, x0] >= 0:
                continue
            fila = deque([(y0, x0)])
            rot[y0, x0] = 1
            pts = []
            while fila:
                y, x = fila.popleft()
                pts.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and rot[ny, nx] < 0:
                            rot[ny, nx] = 1
                            fila.append((ny, nx))
            if len(pts) < 3:
                continue  # poeira
            ys = [p[0] for p in pts]
            xs = [p[1] for p in pts]
            pecas.append((len(pts), float(np.mean(xs)), float(np.mean(ys)), [min(xs) * k, min(ys) * k, (max(xs) + 1) * k, (max(ys) + 1) * k]))
    # pedaços grandes (os corpos) decidem o quadro pelo centro; os pequenos (faíscas, bolhas,
    # chamas soltas) vão para o corpo mais perto, mesmo que passem da linha do meio
    maior = max((n for n, *_ in pecas), default=1)
    grandes = [pc for pc in pecas if pc[0] >= maior * 0.08]
    def quadro(cx: float, cy: float) -> int:
        return min(cols - 1, int(cx * cols / w)) + cols * min(lins - 1, int(cy * lins / h))
    def junta(q: int, c: list[int]) -> None:
        a = caixas[q]
        caixas[q] = c if a is None else [min(a[0], c[0]), min(a[1], c[1]), max(a[2], c[2]), max(a[3], c[3])]
    for n, cx, cy, c in pecas:
        if n >= maior * 0.08:
            junta(quadro(cx, cy), c)
            continue
        def dist(g: tuple) -> float:
            bx0, by0, bx1, by1 = (v / k for v in g[3])
            return max(bx0 - cx, 0, cx - bx1) + max(by0 - cy, 0, cy - by1)
        g = min(grandes, key=dist)
        if dist(g) > w * 0.08:
            continue  # sujeira longe de tudo
        junta(quadro(g[1], g[2]), c)
    return [tuple(c) if c else None for c in caixas]  # type: ignore[misc]


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("folha")
    p.add_argument("--nome", help="prefixo de saída (padrão: nome do arquivo)")
    p.add_argument("--escala", type=float, default=6.5, help="pixels da imagem por pixel do jogo (padrão 6.5)")
    p.add_argument("--cores", type=int, default=32, help="cores por estágio")
    p.add_argument("--saida", default=SAIDA)
    p.add_argument("--nomes", help="um nome por quadro (folha de coisas diferentes)")
    p.add_argument("--tamanhos", help="maior lado de cada desenho, em pixels de jogo (com --nomes)")
    p.add_argument("--grade", default="2x2", help="colunas x linhas da folha (ex.: 3x3 para ícones)")
    p.add_argument("--chao", action="store_true", help="alinha os estágios pela base (instalações em pé no planeta)")
    a = p.parse_args(argv)

    nome = a.nome or os.path.splitext(os.path.basename(a.folha))[0]
    img = Image.open(a.folha).convert("RGBA")
    cols, lins = (int(v) for v in a.grade.lower().split("x"))
    caixas = separar_estagios(img, cols=cols, lins=lins)
    if a.nomes:
        return fatiar_diferentes(img, caixas, a)
    sprites: list[Image.Image] = []
    for i, cx in enumerate(caixas):
        if cx is None:
            print(f"estágio {i + 1}: NÃO ENCONTRADO")
            return 1
        x0, y0, x1, y1 = cx
        # margem e tamanho múltiplo da escala (para a grade cair certinha)
        mg = int(a.escala)
        x0, y0, x1, y1 = max(0, x0 - mg), max(0, y0 - mg), min(img.width, x1 + mg), min(img.height, y1 + mg)
        nw, nh = max(1, round((x1 - x0) / a.escala)), max(1, round((y1 - y0) / a.escala))
        rec = img.crop((x0, y0, x1, y1))
        # apaga o que for de outro estágio dentro da caixa (pedaços do vizinho)
        peq = reduzir(rec, nw, nh, brilhos=True)
        peq = paleta_propria(peq, a.cores)
        peq = tirar_fundo(peq, limiar=26)
        sprites.append(peq)

    # todos os estágios na mesma tela (centro = pivô)
    TW = max(s.width for s in sprites)
    TH = max(s.height for s in sprites)
    TW += TW % 2
    TH += TH % 2
    os.makedirs(a.saida, exist_ok=True)
    for i, s in enumerate(sprites):
        tela = Image.new("RGBA", (TW, TH), (0, 0, 0, 0))
        tela.alpha_composite(s, ((TW - s.width) // 2, TH - s.height if a.chao else (TH - s.height) // 2))
        destino = os.path.join(a.saida, f"{nome}_{i + 1}.png")
        tela.save(destino, optimize=True)
        print(f"estágio {i + 1}: desenho {s.width}x{s.height} em tela {TW}x{TH} -> {os.path.basename(destino)}")
    return 0


def fatiar_diferentes(img: Image.Image, caixas: list, a: argparse.Namespace) -> int:
    """Cada quadro é uma coisa diferente, com tamanho próprio."""
    nomes = a.nomes.split(",")
    tams = [t for t in a.tamanhos.split(",")] if a.tamanhos else ["0"] * len(nomes)
    escala_ant = a.escala
    os.makedirs(a.saida, exist_ok=True)
    for i, nome in enumerate(nomes):
        if nome == "-":
            continue
        cx = caixas[i] if i < len(caixas) else None
        if cx is None:
            print(f"{nome}: NÃO ENCONTRADO")
            continue
        x0, y0, x1, y1 = cx
        lado = max(x1 - x0, y1 - y0)
        # "=" usa a mesma escala do quadro anterior (ex.: chefe enfurecido do mesmo tamanho do normal)
        escala = escala_ant if tams[i] == "=" else lado / int(tams[i]) if int(tams[i]) else a.escala
        escala_ant = escala
        mg = int(escala)
        x0, y0, x1, y1 = max(0, x0 - mg), max(0, y0 - mg), min(img.width, x1 + mg), min(img.height, y1 + mg)
        nw, nh = max(1, round((x1 - x0) / escala)), max(1, round((y1 - y0) / escala))
        peq = reduzir(img.crop((x0, y0, x1, y1)), nw, nh, brilhos=True)
        peq = paleta_propria(peq, a.cores)
        peq = tirar_fundo(peq, limiar=26)
        # tela de lado par, desenho no centro (centro = pivô de giro)
        tw, th = peq.width + peq.width % 2, peq.height + peq.height % 2
        tela = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        tela.alpha_composite(peq, ((tw - peq.width) // 2, (th - peq.height) // 2))
        destino = os.path.join(a.saida, f"{nome}.png")
        tela.save(destino, optimize=True)
        print(f"{nome}: {tw}x{th} (escala {escala:.2f}) -> {os.path.basename(destino)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
