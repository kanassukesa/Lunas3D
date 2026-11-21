import { Mesh, MeshGeometry, Shader, Texture } from "pixi.js";
import { spritesReais } from "./Sprites";

/**
 * Planeta 3D girando: um mapa equirretangular (2:1) enrolado numa esfera por shader,
 * com camada de nuvens girando em outra velocidade, luz vinda de cima à esquerda e atmosfera na borda.
 * Usa `planeta_mapa.png` / `planeta_nuvens.png` da arte final quando existirem; senão gera um mapa procedural.
 */
const VERT = `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}`;

const FRAG = `
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uMapa;
uniform sampler2D uNuvens;
uniform float uRot;
uniform float uRotNuvem;
uniform float uDano;
void main() {
  vec2 p = vUV * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) { finalColor = vec4(0.0); return; }
  float z = sqrt(max(0.0, 1.0 - r * r));
  vec3 n = vec3(p.x, p.y, z);
  // eixo levemente inclinado
  float c = 0.966; float s = 0.259;
  vec3 m = vec3(n.x * c - n.y * s, n.x * s + n.y * c, n.z);
  float lat = asin(clamp(-m.y, -1.0, 1.0));
  float lon = atan(m.x, m.z);
  float v = 0.5 - lat / 3.14159265;
  vec3 cor = texture(uMapa, vec2(fract(lon / 6.2831853 + 0.5 + uRot), v)).rgb;
  vec4 nv = texture(uNuvens, vec2(fract(lon / 6.2831853 + 0.5 + uRotNuvem), v));
  cor = mix(cor, vec3(1.0), nv.a * 0.9);
  vec3 L = normalize(vec3(-0.55, -0.62, 0.56));
  float dif = max(dot(n, L), 0.0);
  float lado = smoothstep(-0.25, 0.35, dot(n, L));
  cor *= 0.16 + 1.0 * dif;
  // brilho especular suave no oceano
  vec3 h = normalize(L + vec3(0.0, 0.0, 1.0));
  cor += vec3(0.55, 0.75, 1.0) * pow(max(dot(n, h), 0.0), 40.0) * 0.35 * (1.0 - nv.a);
  // atmosfera
  float rim = pow(1.0 - z, 2.2);
  cor += vec3(0.30, 0.62, 1.0) * rim * (0.35 + 0.9 * lado);
  cor = mix(cor, vec3(1.0, 0.25, 0.25), uDano * 0.4);
  float a = 1.0 - smoothstep(0.985, 1.0, r);
  finalColor = vec4(cor * a, a);
}`;

// ---------------------------------------------------------------- mapa procedural (fallback)

function hash(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function ruido(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function fbm(x: number, y: number, z: number, oit: number): number {
  let t = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oit; i++) {
    t += a * ruido(x * f, y * f, z * f);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return t / n;
}

function gerarMapa(W: number, H: number, nuvens: boolean): Texture {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
  for (let j = 0; j < H; j++) {
    const lat = (0.5 - (j + 0.5) / H) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < W; i++) {
      const lon = ((i + 0.5) / W) * Math.PI * 2;
      // amostra o ruído na esfera: o mapa emenda sem costura
      const x = cl * Math.cos(lon), y = sl, z = cl * Math.sin(lon);
      const k = (j * W + i) * 4;
      if (nuvens) {
        const n = fbm(x * 3 + 11, y * 5 + 3, z * 3 - 7, 5);
        const faixa = 0.75 + 0.25 * Math.cos(lat * 6);
        const a = Math.max(0, Math.min(1, (n * faixa - 0.47) * 4.5));
        d[k] = d[k + 1] = d[k + 2] = 255;
        d[k + 3] = a * 235;
        continue;
      }
      const hgt = fbm(x * 1.6 + 5, y * 1.6, z * 1.6 - 2, 5) + 0.12 * fbm(x * 6, y * 6, z * 6, 3);
      let c: number[];
      if (hgt < 0.5) c = mix([8, 40, 110], [24, 110, 205], (hgt - 0.3) / 0.2);
      else if (hgt < 0.525) c = mix([40, 150, 215], [215, 200, 140], (hgt - 0.5) / 0.025);
      else if (hgt < 0.62) c = mix([70, 165, 60], [40, 120, 45], (hgt - 0.525) / 0.095);
      else if (hgt < 0.7) c = mix([40, 120, 45], [150, 120, 70], (hgt - 0.62) / 0.08);
      else c = mix([150, 120, 70], [235, 235, 240], (hgt - 0.7) / 0.08);
      const polo = Math.abs(lat) / (Math.PI / 2);
      c = mix(c, [235, 245, 255], (polo - 0.8) / 0.08);
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return Texture.from(cv);
}

let mapas: { terra: Texture; nuvens: Texture } | null = null;
function obterMapas(): { terra: Texture; nuvens: Texture } {
  if (!mapas) {
    const terra = spritesReais.get("planeta_mapa") ?? gerarMapa(512, 256, false);
    const nuvens = spritesReais.get("planeta_nuvens") ?? gerarMapa(512, 256, true);
    for (const t of [terra, nuvens]) {
      t.source.style.addressModeU = "repeat";
      t.source.style.addressModeV = "clamp-to-edge";
      t.source.style.scaleMode = "linear";
    }
    mapas = { terra, nuvens };
  }
  return mapas;
}

export class PlanetSphere {
  readonly mesh: Mesh<MeshGeometry, Shader>;
  private shader: Shader;
  /** Voltas por segundo (fração do mapa). */
  velocidade = 0.012;
  velNuvem = 0.018;

  constructor(raio: number) {
    const { terra, nuvens } = obterMapas();
    const geometry = new MeshGeometry({
      positions: new Float32Array([-raio, -raio, raio, -raio, raio, raio, -raio, raio]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    });
    this.shader = Shader.from({
      gl: { vertex: VERT, fragment: FRAG, name: "planeta-esfera" },
      resources: {
        uMapa: terra.source,
        uNuvens: nuvens.source,
        planeta: {
          uRot: { value: 0, type: "f32" },
          uRotNuvem: { value: 0, type: "f32" },
          uDano: { value: 0, type: "f32" },
        },
      },
    });
    this.mesh = new Mesh({ geometry, shader: this.shader });
  }

  update(tempo: number, dano: number): void {
    const u = this.shader.resources.planeta.uniforms;
    u.uRot = (tempo * this.velocidade) % 1;
    u.uRotNuvem = (tempo * this.velNuvem) % 1;
    u.uDano = dano;
  }
}
