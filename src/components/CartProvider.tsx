"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CartLine } from "@/types/db";

interface CartContextValue {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotalPaise: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nehasgiftbox_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage might be full/disabled — cart just won't persist
    }
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product_id === item.product_id);
      if (existing) {
        return prev.map((l) =>
          l.product_id === item.product_id ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQty: CartContextValue["updateQty"] = (productId, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product_id !== productId)
        : prev.map((l) => (l.product_id === productId ? { ...l, quantity: qty } : l))
    );
  };

  const removeItem: CartContextValue["removeItem"] = (productId) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  };

  const clear = () => setLines([]);

  const subtotalPaise = useMemo(
    () => lines.reduce((sum, l) => sum + l.unit_price_paise * l.quantity, 0),
    [lines]
  );
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{ lines, addItem, updateQty, removeItem, clear, subtotalPaise, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
