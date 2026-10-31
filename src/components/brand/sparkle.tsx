import type { SVGProps } from "react";

/** Estrela de 4 pontas — elemento gráfico tirado da logo. */
export function Sparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 1.5c.6 4.9 2.6 8.3 10.5 10.5-7.9 2.2-9.9 5.6-10.5 10.5C11.4 17.6 9.4 14.2 1.5 12 9.4 9.8 11.4 6.4 12 1.5Z" />
    </svg>
  );
}
