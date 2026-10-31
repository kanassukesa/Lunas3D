"use client";

import { useSyncExternalStore } from "react";

/**
 * Carrinho no navegador (localStorage) — funciona sem login.
 * Nesta etapa só existe a contagem para o ícone do header;
 * a Etapa 2 implementa adicionar/remover itens.
 */
export const CART_STORAGE_KEY = "lunas3d:cart:v1";
const CART_EVENT = "lunas3d:cart-changed";

export type CartItem = {
  productId: string;
  colorId: string;
  quantity: number;
};

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // modo anônimo/armazenamento cheio: o carrinho só não é persistido
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) callback();
  };
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", onStorage); // sincroniza entre abas
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getCountSnapshot() {
  return readCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/** Quantidade total de itens no carrinho (0 no servidor). */
export function useCartCount() {
  return useSyncExternalStore(subscribe, getCountSnapshot, () => 0);
}
