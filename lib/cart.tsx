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
  saved: CartLine[];
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  saveForLater: (variantId: string) => void;
  moveToCart: (variantId: string) => void;
  removeSaved: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotalPaise: number;
  hydrated: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<CartContext | null>(null);
const STORAGE_KEY = "nivi-cart-v2";
const SAVED_KEY = "nivi-saved-v1";
const MAX_QTY_PER_LINE = 10;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [saved, setSaved] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setSaved(parsed.filter(isCartLine));
    } catch {
      // Same as above.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved, hydrated]);

  const value = useMemo<CartContext>(
    () => ({
      lines,
      saved,
      hydrated,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalPaise: lines.reduce((sum, l) => sum + l.pricePaise * l.qty, 0),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add: (line) => {
        setLines((prev) => {
          const existing = prev.find((l) => l.variantId === line.variantId);
          if (!existing) return [...prev, { ...line, qty: 1 }];
          return prev.map((l) =>
            l.variantId === line.variantId
              ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY_PER_LINE) }
              : l,
          );
        });
        setDrawerOpen(true);
      },
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
      // Reads the current (outer-scope) `lines`/`saved` rather than nesting
      // one updater inside another: two independent setState calls, batched
      // by React into a single re-render, and no risk of a functional
      // updater re-running twice under Strict Mode double-invocation.
      saveForLater: (variantId) => {
        const line = lines.find((l) => l.variantId === variantId);
        if (!line) return;
        setSaved((s) =>
          s.some((l) => l.variantId === variantId) ? s : [...s, line],
        );
        setLines((prev) => prev.filter((l) => l.variantId !== variantId));
      },
      moveToCart: (variantId) => {
        const line = saved.find((l) => l.variantId === variantId);
        if (!line) return;
        setLines((prev) => {
          const existing = prev.find((l) => l.variantId === variantId);
          if (!existing) return [...prev, line];
          return prev.map((l) =>
            l.variantId === variantId
              ? { ...l, qty: Math.min(l.qty + line.qty, MAX_QTY_PER_LINE) }
              : l,
          );
        });
        setSaved((prev) => prev.filter((l) => l.variantId !== variantId));
      },
      removeSaved: (variantId) =>
        setSaved((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => setLines([]),
    }),
    [lines, saved, hydrated, drawerOpen],
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
