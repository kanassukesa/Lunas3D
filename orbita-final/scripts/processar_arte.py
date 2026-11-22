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
    # efeitos luminosos: o brilho vira transparência (ficam bonitos com blend aditivo)
    "missil_chama": ("aditivo", 256),
    "bala_pulso": ("aditivo", 256),
    "trilho": ("aditivo", 512),
    "gelo_tiro": ("aditivo", 256),
    "tiro_inimigo": ("aditivo", 128),
    "vortice": ("aditivo", 512),
    "explosao_sheet": ("sheet", 1024),
    "carta_": ("carta", 600),
    "tile_": ("carta", 520),
    "avatar_": ("avatar", 256),
    "botao_batalha": ("recorte", 1024),
    "banner_": ("recorte", 900),
    "bau_": ("quadro", 640),
    "fase_": ("carta", 640),
    "modo_": ("carta", 640),
    "talento_": ("recorte", 192),
    "hangar_": ("recorte", 384),
    "pedestal": ("recorte", 840),
    "premio_": ("recorte", 160),
    "loja_": ("recorte", 160),
    "patente_": ("recorte", 160),
    "fundo_": ("fundo_tela", 720),
    "icone_app": ("icone_app", 512),
    "logo": ("recorte", 900),
    "moeda_": ("recorte", 128),
    "chip_": ("recorte", 192),
    "icone_ultimate": ("recorte", 192),
    "planeta_mapa": ("mapa", 1024),
    "planeta_nuvens": ("nuvens", 1024),
    "planeta": ("fundo", 512),
    "torre_base": ("fundo", 256),
    "cabeca_": ("cabeca", 256),
    "escudo": ("aditivo", 512),
    "domo_eletrico": ("aditivo", 512),
    "emblema_": ("recorte", 360),
    "sentinela_": ("fundo", 256),
    "inimigo_": ("fundo", 256),
    "chefe_": ("fundo", 512),
    "missil": ("fundo", 256),
    "drone": ("fundo", 128),
    # telas da batalha
    "faixa_": ("recorte", 900),
    "moldura_": ("moldura", 480),
    "estrela_": ("recorte", 160),
    "icone_": ("recorte", 128),  # depois de icone_app / icone_ultimate (a ordem importa)
}


def dilatar(m):
    d = m.copy()
    d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    return d


def ligado_as_bordas(cand, miolo=False):
    """Flood fill: pixels candidatos conectados à borda da imagem (e ao centro, com miolo=True)."""
    sel = np.zeros_like(cand)
    sel[0, :] = cand[0, :]; sel[-1, :] = cand[-1, :]; sel[:, 0] = cand[:, 0]; sel[:, -1] = cand[:, -1]
    if miolo:
        hh, ww = cand.shape
        sel[hh // 2, ww // 2] = cand[hh // 2, ww // 2]
    while True:
        novo = dilatar(sel) & cand
        if novo.sum() == sel.sum():
            return novo
        sel = novo


def remover_fundo(rgb, miolo=False):
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
        fundo = ligado_as_bordas(cand, miolo)
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
    faixa = max(8, tam // (64 if nome == "planeta_mapa" else 24))
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


def cabeca(arq, nome, tam):
    """Cabeça de torre: centraliza no PIVÔ (centro do corpo, não da imagem) e mede o raio do corpo.

    O pivô fica no centro do sprite para a cabeça girar no lugar certo. Grava em cabecas.json a razão
    corpo/raio total, para o jogo deixar todos os corpos do mesmo tamanho (o cano pode sobrar).
    """
    import json
    rgb = np.asarray(Image.open(os.path.join(ORIG, arq)).convert("RGB")).astype(np.float32)
    rgba = remover_fundo(rgb)
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    alturas = a.sum(axis=0)
    corpo = alturas > alturas.max() * 0.6  # colunas "gordas" = corpo (o cano é fino)
    cols = np.nonzero(corpo)[0]
    px = float(cols.mean())
    py = float(ys.mean())
    r_total = float(np.sqrt((xs - px) ** 2 + (ys - py) ** 2).max()) * 1.03
    # raio do corpo: até onde vai o opaco a partir do pivô, para a esquerda/cima/baixo (o cano vai para a direita)
    r_corpo = max(px - xs.min(), py - ys.min(), ys.max() - py)
    lado = int(np.ceil(r_total * 2))
    img = Image.fromarray(rgba, "RGBA")
    out = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    out.paste(img, (int(round(lado / 2 - px)), int(round(lado / 2 - py))))
    out = out.resize((tam, tam), Image.LANCZOS)
    out.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
    meta_p = os.path.join(SAIDA, "cabecas.json")
    meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
    meta[nome.replace("cabeca_", "")] = round(r_corpo / r_total, 4)
    json.dump(meta, open(meta_p, "w"), indent=1, sort_keys=True)
    print(f"{nome}.png  {tam}x{tam}  (cabeça: corpo = {r_corpo / r_total:.2f} do raio)")


def processar(arq):
    nome = os.path.splitext(arq)[0]
    modo, tam = next((v for k, v in CONFIG.items() if nome.startswith(k)), ("fundo", 256))
    if modo in ("mapa", "nuvens"):
        return mapa_esfera(arq, nome, tam, modo == "nuvens")
    if modo == "cabeca":
        return cabeca(arq, nome, tam)
    if modo == "avatar":
        im = Image.open(os.path.join(ORIG, arq)).convert("RGB")
        lado = min(im.size)
        im = im.crop(((im.width - lado) // 2, (im.height - lado) // 2, (im.width + lado) // 2, (im.height + lado) // 2))
        im.resize((tam, tam), Image.LANCZOS).save(os.path.join(SAIDA, nome + ".jpg"), quality=88)
        return print(f"{nome}.jpg  {tam}x{tam}  (avatar)")
    if modo == "fundo_tela":
        im = Image.open(os.path.join(ORIG, arq)).convert("RGB")
        im = im.resize((tam, round(tam * im.height / im.width)), Image.LANCZOS)
        im.save(os.path.join(SAIDA, nome + ".jpg"), quality=84)
        return print(f"{nome}.jpg  {im.width}x{im.height}  (fundo de tela)")
    if modo == "icone_app":
        # ícones do PWA (tela inicial do iPhone/Android) — imagem cheia, sem recorte
        im = Image.open(os.path.join(ORIG, arq)).convert("RGB")
        pub = os.path.join(RAIZ, "public", "icons")
        for t in (180, 192, 512):
            im.resize((t, t), Image.LANCZOS).save(os.path.join(pub, f"icon-{t}.png"), optimize=True)
        return print("public/icons/icon-180/192/512.png  (ícone do app)")
    if modo == "quadro":
        # quadros de animação (baú): tira o fundo mas corta TODOS no mesmo retângulo, para ficarem alinhados
        rgb = np.asarray(Image.open(os.path.join(ORIG, arq)).convert("RGB")).astype(np.float32)
        img = Image.fromarray(remover_fundo(rgb), "RGBA")
        w, hh = img.size
        img = img.crop((round(w * 0.02), round(hh * 0.02), round(w * 0.98), round(hh * 0.87)))
        img = img.resize((tam, round(tam * img.height / img.width)), Image.LANCZOS)
        img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
        return print(f"{nome}.png  {img.width}x{img.height}  (quadro)")
    if modo == "moldura":
        # moldura de carta: o preto de fora E o miolo viram transparência (a arte da carta aparece por dentro)
        rgb = np.asarray(Image.open(os.path.join(ORIG, arq)).convert("RGB")).astype(np.float32)
        img = Image.fromarray(remover_fundo(rgb, miolo=True), "RGBA")
        bbox = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)
        k = tam / max(img.size)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
        img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
        return print(f"{nome}.png  {img.width}x{img.height}  (moldura, miolo vazado)")
    if modo == "recorte":
        # interface: tira o fundo e corta no contorno, mantendo a proporção (lado maior = tam)
        rgb = np.asarray(Image.open(os.path.join(ORIG, arq)).convert("RGB")).astype(np.float32)
        img = Image.fromarray(remover_fundo(rgb), "RGBA")
        bbox = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)
        k = tam / max(img.size)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
        img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
        return print(f"{nome}.png  {img.width}x{img.height}  (interface)")
    if modo == "carta":
        im = Image.open(os.path.join(ORIG, arq)).convert("RGB")
        im = im.resize((tam, round(tam * im.height / im.width)), Image.LANCZOS)
        im.save(os.path.join(SAIDA, nome + ".jpg"), quality=86)
        return print(f"{nome}.jpg  {im.width}x{im.height}  (carta)")
    if modo == "sheet":
        rgb = np.asarray(Image.open(os.path.join(ORIG, arq)).convert("RGB")).astype(np.float32)
        img = Image.fromarray(aditivo(rgb), "RGBA").resize((tam, tam // 2), Image.LANCZOS)
        img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
        return print(f"{nome}.png  {tam}x{tam // 2}  (folha de animação 4x2)")
    src = Image.open(os.path.join(ORIG, arq)).convert("RGB")
    rgb = np.asarray(src).astype(np.float32)
    rgba = aditivo(rgb) if modo == "aditivo" else remover_fundo(rgb)
    img = Image.fromarray(rgba, "RGBA")
    # sentinelas mantêm o centro da base hexagonal no centro do sprite (o cano sai para a direita)
    img = recortar_quadrado(img, 0.02 if nome == "planeta" or nome.startswith("escudo") or nome == "domo_eletrico" else 0.04)
    img = img.resize((tam, tam), Image.LANCZOS)
    img.save(os.path.join(SAIDA, nome + ".png"), optimize=True)
    print(f"{nome}.png  {tam}x{tam}  ({modo})")


if __name__ == "__main__":
    os.makedirs(SAIDA, exist_ok=True)
    alvos = sys.argv[1:] or sorted(os.listdir(ORIG))
    for a in alvos:
        if a.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            processar(a)
