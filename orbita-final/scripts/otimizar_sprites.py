"""
Deixa a arte do jogo leve para o celular: converte src/assets/sprites/*.png|jpg em WebP.

  python scripts/otimizar_sprites.py            (todos)
  python scripts/otimizar_sprites.py carta_gelo (só esses nomes)

- Cartas (carta_*): 420 px de largura (na tela aparecem com ~130 px; 420 cobre telas 3x).
- Resto: mesmo tamanho, WebP com transparência (PNG de 800 KB vira ~100-200 KB).
O processar_arte.py chama isto sozinho depois de gerar cada imagem.
"""
import os
import sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(RAIZ, "src", "assets", "sprites")
LARG_CARTA = 420


def otimizar(arq: str) -> tuple[int, int] | None:
    """Converte um arquivo de sprites para .webp (apaga o original). Devolve (bytes antes, bytes depois)."""
    caminho = os.path.join(SPRITES, arq)
    nome, ext = os.path.splitext(arq)
    if ext.lower() not in (".png", ".jpg", ".jpeg"):
        return None
    antes = os.path.getsize(caminho)
    im = Image.open(caminho)
    im.load()
    if nome.startswith("carta_") and im.width > LARG_CARTA:
        im = im.resize((LARG_CARTA, round(im.height * LARG_CARTA / im.width)), Image.LANCZOS)
    destino = os.path.join(SPRITES, nome + ".webp")
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        im.save(destino, "WEBP", quality=86, alpha_quality=92, method=6)
    else:
        im = im.convert("RGB")
        im.save(destino, "WEBP", quality=82 if nome.startswith("carta_") else 84, method=6)
    os.remove(caminho)
    return antes, os.path.getsize(destino)


if __name__ == "__main__":
    alvos = sys.argv[1:]
    arquivos = sorted(f for f in os.listdir(SPRITES) if not alvos or os.path.splitext(f)[0] in alvos)
    total_a = total_d = 0
    for f in arquivos:
        r = otimizar(f)
        if r:
            total_a += r[0]
            total_d += r[1]
    print(f"{len(arquivos)} arquivos: {total_a / 1e6:.1f} MB -> {total_d / 1e6:.1f} MB")
