"""Gera o logo Lunas3D em 3D (3MF multicor + GLB para visualização)."""
import math, zipfile, sys
import numpy as np
import trimesh
from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.ops import unary_union
from shapely import affinity
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties

OUT = sys.argv[1]
FONT = FontProperties(fname=f"{OUT}/fonts/LilitaOne.ttf")

def text_poly(s, size):
    tp = TextPath((0, 0), s, size=size, prop=FONT)
    polys = [Polygon(p) for p in tp.to_polygons() if len(p) > 2]
    # even-odd: build by XOR so holes (a, d, 3...) work
    res = Polygon()
    for p in sorted(polys, key=lambda p: -p.area):
        p = p.buffer(0)
        res = res.symmetric_difference(p)
    return res

def bubbly(g, r=0.9):
    return g.buffer(r, join_style=1).buffer(-r, join_style=1)

def fill_holes(g):
    geoms = g.geoms if isinstance(g, MultiPolygon) else [g]
    return unary_union([Polygon(p.exterior) for p in geoms])

def star4(cx, cy, R, r=None, rot=0):
    r = r or R * 0.38
    pts = []
    for i in range(8):
        a = math.radians(rot + 90 + i * 45)
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return Polygon(pts).buffer(R * 0.08, join_style=1)

def star5(cx, cy, R, rot=0):
    pts = []
    for i in range(10):
        a = math.radians(rot + 90 + i * 36)
        rad = R if i % 2 == 0 else R * 0.48
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return Polygon(pts).buffer(R * 0.1, join_style=1).buffer(-R * 0.04)

# ---------- 2D layout (mm) ----------
lunas = bubbly(text_poly("Lunas", 34), 0.8)
lunas = affinity.skew(lunas, xs=-6, origin=(0, 0))
lb = lunas.bounds
d3 = bubbly(text_poly("3D", 26), 0.8)
d3b = d3.bounds
d3 = affinity.translate(d3, lb[2] + 3.5 - d3b[0], 4)

letters = unary_union([lunas, d3])

OUTLINE = 1.6   # contorno escuro
BORDER = 5.0    # borda amarela
outline_ring = fill_holes(letters.buffer(OUTLINE, join_style=1)).difference(letters)

minx, miny, maxx, maxy = letters.bounds
stars_yellow = [
    star4(minx + 38, maxy + 7, 6.5),
    star4(maxx - 22, maxy + 5, 4.2),
    star5(maxx + 1, miny - 4, 4.0),
]
stars_blue = [
    star4(minx + 22, maxy + 5, 4.5),
    star4(minx + 54, maxy + 7, 4.0),
    star4(minx - 6, miny + 10, 5.0),
    star4(maxx - 6, maxy + 6, 4.5),
]
star_union = unary_union(stars_yellow + stars_blue)
base = fill_holes(unary_union([
    letters.buffer(OUTLINE + BORDER, join_style=1),
    star_union.buffer(2.2, join_style=1),
]))
base = bubbly(base.buffer(1.5).buffer(-1.5), 1.0).simplify(0.05)

# ---------- 3D ----------
Z_BASE = 3.0        # placa amarela
H_OUTLINE = 3.0     # contorno escuro
H_LETTER = 4.6      # letras (ficam mais altas que o contorno)
H_STAR = 2.0

def extrude(g, z0, h):
    geoms = g.geoms if isinstance(g, MultiPolygon) else [g]
    ms = [trimesh.creation.extrude_polygon(p.simplify(0.03), h) for p in geoms if p.area > 0.01]
    m = trimesh.util.concatenate(ms)
    m.apply_translation([0, 0, z0])
    return m

parts = {
    "Base amarela": (extrude(base, 0, Z_BASE), (255, 205, 60)),
    "Contorno": (extrude(outline_ring, Z_BASE, H_OUTLINE), (40, 30, 45)),
    "Lunas (rosa)": (extrude(lunas.difference(Point(0, 0).buffer(0)), Z_BASE, H_LETTER), (240, 82, 120)),
    "3D (azul)": (extrude(d3, Z_BASE, H_LETTER), (45, 150, 235)),
    "Estrelas amarelas": (extrude(unary_union(stars_yellow).difference(outline_ring.buffer(0.01)).difference(letters),
                                  Z_BASE, H_STAR), (255, 225, 90)),
    "Estrelas azuis": (extrude(unary_union(stars_blue).difference(outline_ring.buffer(0.01)).difference(letters),
                               Z_BASE, H_STAR), (60, 160, 240)),
}

# center on plate
allb = trimesh.util.concatenate([m for m, _ in parts.values()]).bounds
shift = [-(allb[0][0] + allb[1][0]) / 2, -(allb[0][1] + allb[1][1]) / 2, 0]
for m, _ in parts.values():
    m.apply_translation(shift)
    m.merge_vertices(); m.fix_normals()
allb = trimesh.util.concatenate([m for m, _ in parts.values()]).bounds
print("Tamanho (mm):", np.round(allb[1] - allb[0], 1))
for n, (m, _) in parts.items():
    print(f"  {n}: {len(m.faces)} faces, watertight={m.is_watertight}")

# ---------- 3MF ----------
def hexc(c): return "#%02X%02X%02XFF" % c
names = list(parts)
res = ['<basematerials id="1">'] + [
    f'<base name="{n}" displaycolor="{hexc(parts[n][1])}"/>' for n in names] + ['</basematerials>']
objs, build = [], []
for i, n in enumerate(names):
    m = parts[n][0]
    oid = i + 2
    v = "".join(f'<vertex x="{x:.4f}" y="{y:.4f}" z="{z:.4f}"/>' for x, y, z in m.vertices)
    t = "".join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in m.faces)
    objs.append(f'<object id="{oid}" name="{n}" type="model" pid="1" pindex="{i}">'
                f'<mesh><vertices>{v}</vertices><triangles>{t}</triangles></mesh></object>')
# single assembly object so slicers keep parts aligned as one multi-part object
comp = "".join(f'<component objectid="{i + 2}"/>' for i in range(len(names)))
aid = len(names) + 2
objs.append(f'<object id="{aid}" name="Lunas3D Logo" type="model"><components>{comp}</components></object>')
build.append(f'<item objectid="{aid}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>')
model = ('<?xml version="1.0" encoding="UTF-8"?>\n'
         '<model unit="millimeter" xml:lang="pt-BR" '
         'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'
         '<metadata name="Title">Lunas3D Logo</metadata>'
         f'<resources>{"".join(res)}{"".join(objs)}</resources><build>{"".join(build)}</build></model>')
ct = ('<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
rels = ('<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Target="/3D/3dmodel.model" Id="rel0" '
        'Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
with zipfile.ZipFile(f"{OUT}/Lunas3D-logo.3mf", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", ct)
    z.writestr("_rels/.rels", rels)
    z.writestr("3D/3dmodel.model", model)

# ---------- GLB for the viewer ----------
scene = trimesh.Scene()
for n, (m, c) in parts.items():
    mm = m.copy()
    mm.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        baseColorFactor=[c[0] / 255, c[1] / 255, c[2] / 255, 1], roughnessFactor=0.35, metallicFactor=0.0))
    scene.add_geometry(mm, node_name=n)
scene.export(f"{OUT}/Lunas3D-logo.glb")
print("ok")
