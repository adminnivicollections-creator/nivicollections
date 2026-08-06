"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// A cart line keeps a display snapshot so the cart renders without a round
// trip. It is NOT trusted: /api/checkout re-reads name, price and stock from
// the database and rejects anything that disagrees. Never bill from this.
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  pricePaise: number;
  imagePath: string | null;
  qty: number;
};

type CartContext = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotalPaise: number;
  hydrated: boolean;
};

const Ctx = createContext<CartContext | null>(null);
const STORAGE_KEY = "nivi-cart-v2";
const MAX_QTY_PER_LINE = 10;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cart must start empty so SSR and the first client render agree;
  // localStorage is only readable after mount, hence the setState here.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine));
    } catch {
      // Corrupt or unavailable storage: start empty rather than crash.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalPaise: lines.reduce((sum, l) => sum + l.pricePaise * l.qty, 0),
      add: (line) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.variantId === line.variantId);
          if (!existing) return [...prev, { ...line, qty: 1 }];
          return prev.map((l) =>
            l.variantId === line.variantId
              ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY_PER_LINE) }
              : l,
          );
        }),
      setQty: (variantId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.variantId !== variantId)
            : prev.map((l) =>
                l.variantId === variantId
                  ? { ...l, qty: Math.min(qty, MAX_QTY_PER_LINE) }
                  : l,
              ),
        ),
      remove: (variantId) =>
        setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => setLines([]),
    }),
    [lines, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function isCartLine(v: unknown): v is CartLine {
  if (typeof v !== "object" || v === null) return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.variantId === "string" &&
    typeof l.productId === "string" &&
    typeof l.slug === "string" &&
    typeof l.name === "string" &&
    typeof l.size === "string" &&
    typeof l.pricePaise === "number" &&
    typeof l.qty === "number" &&
    l.qty > 0
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
