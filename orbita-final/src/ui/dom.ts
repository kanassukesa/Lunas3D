type Child = Node | string | number | null | undefined | false;
type Props = {
  class?: string;
  text?: string;
  html?: string;
  style?: string;
  onclick?: (ev: MouseEvent) => void;
  disabled?: boolean;
  [attr: string]: unknown;
};

/** Pequeno helper para criar DOM sem framework. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = String(v);
      else if (k === "text") el.textContent = String(v);
      else if (k === "html") el.innerHTML = String(v);
      else if (k === "style") el.setAttribute("style", String(v));
      else if (k === "onclick") el.addEventListener("click", v as EventListener);
      else if (k === "disabled") (el as HTMLButtonElement).disabled = Boolean(v);
      else el.setAttribute(k, String(v));
    }
  }
  for (const c of kids) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

export const hex = (n: number) => "#" + n.toString(16).padStart(6, "0");

export function toast(root: HTMLElement, msg: string): void {
  const t = h("div", { class: "toast", text: msg });
  root.append(t);
  setTimeout(() => t.remove(), 1800);
}

export function fmtTempo(s: number): string {
  s = Math.max(0, Math.floor(s));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtInt(n: number): string {
  return Math.floor(n).toLocaleString("pt-BR");
}

export const ICONE_MOEDA = { creditos: "🪙", nucleos: "🔷", cristais: "💎" };
