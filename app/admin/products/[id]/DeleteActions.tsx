"use client";

import { deleteProduct, hardDeleteProduct, duplicateProduct } from "../../actions";

export function DeleteActions({ productId }: { productId: string }) {
  return (
    <div className="flex flex-wrap gap-8 border-t border-ink/10 pt-8">
      <form action={() => duplicateProduct(productId)}>
        <button
          type="submit"
          className="text-xs uppercase tracking-[0.15em] text-gold"
        >
          Duplicate
        </button>
        <p className="mt-2 max-w-xs text-xs text-ink/40">
          Creates a hidden copy with zero stock, ready to edit.
        </p>
      </form>

      <form action={() => deleteProduct(productId)}>
        <button
          type="submit"
          className="text-xs uppercase tracking-[0.15em] text-red-700"
        >
          Hide from shop
        </button>
        <p className="mt-2 max-w-xs text-xs text-ink/40">
          Keeps the product for past orders, but removes it from the storefront.
        </p>
      </form>

      <form
        action={() => hardDeleteProduct(productId)}
        onSubmit={(e) => {
          if (!confirm("Permanently delete this product? This cannot be undone."))
            e.preventDefault();
        }}
      >
        <button
          type="submit"
          className="text-xs uppercase tracking-[0.15em] text-red-900"
        >
          Permanently delete
        </button>
        <p className="mt-2 max-w-xs text-xs text-ink/40">
          Removes this product and all its images, variants, and data forever.
        </p>
      </form>
    </div>
  );
}
