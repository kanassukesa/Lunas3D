import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Cache Components desativado de propósito: quase todas as páginas da loja
  // dependem de sessão (login, carrinho, admin) e de conteúdo editado no painel.
  // O modelo "dinâmico por padrão" é mais simples de manter.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/**" }]
        : []),
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/v1/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
