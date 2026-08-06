"use client";

import { useState } from "react";
import Link from "next/link";

export function TryOnWidget({
  productId,
  signedIn,
  path,
}: {
  productId: string;
  signedIn: boolean;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "shared" | "downloaded">("idle");

  if (!signedIn) {
    return (
      <section className="mt-28 border-t border-[#c59e5a]/20 pt-16 text-center">
        <h2 className="font-serif text-3xl font-light text-[#f3e6cc]">
          See It On You
        </h2>
        <p className="mt-3 text-sm text-[#f3e6cc]/60">
          Sign in to preview this saree on your own photo, using AI.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(path)}`}
          className="mt-6 inline-block border border-[#c59e5a] px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
        >
          Sign in
        </Link>
      </section>
    );
  }

  async function share() {
    if (!result) return;
    const res = await fetch(result);
    const blob = await res.blob();
    const file = new File([blob], "try-on.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My try-on preview",
          text: "See how this saree looks on me",
        });
        setShareState("shared");
        return;
      } catch {
        // User cancelled the share sheet — fall through to download.
      }
    }

    const a = document.createElement("a");
    a.href = result;
    a.download = "try-on.png";
    a.click();
    setShareState("downloaded");
  }

  async function submit() {
    if (!file || !consent) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("productId", productId);
      form.append("photo", file);
      const res = await fetch("/api/tryon", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate a preview.");
      } else {
        setResult(data.image);
      }
    } catch {
      setError("Could not reach the try-on service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-28 border-t border-[#c59e5a]/20 pt-16">
      <h2 className="text-center font-serif text-3xl font-light text-[#f3e6cc]">
        See It On You
      </h2>
      <p className="mt-3 text-center text-sm text-[#f3e6cc]/60">
        Upload a clear, front-facing photo and see an AI preview of this
        saree on you. Your photo is never saved — it is used only to
        generate this one preview.
      </p>

      {!open ? (
        <div className="mt-8 text-center">
          <button
            onClick={() => setOpen(true)}
            className="border border-[#c59e5a] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-[#f3e6cc]"
          >
            Try it on
          </button>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md">
          {result ? (
            <div className="text-center">
              <img
                src={result}
                alt="AI-generated preview of you wearing this saree"
                className="mx-auto w-full max-w-sm"
              />
              <p className="mt-4 text-xs text-[#f3e6cc]/40">
                AI-generated preview. Actual fit, drape and colour may vary.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="#add-to-cart"
                  className="bg-[#c59e5a] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#0b0906]"
                >
                  🛒 Add to cart
                </a>
                <button
                  onClick={share}
                  className="border border-[#c59e5a] px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]"
                >
                  📤 {shareState === "idle" ? "Share" : shareState === "shared" ? "Shared" : "Saved"}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setConsent(false);
                    setShareState("idle");
                  }}
                  className="px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#f3e6cc]/60"
                >
                  Try another photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label
                htmlFor="tryon-photo"
                className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#c59e5a]/40 px-6 py-10 text-center"
              >
                <span className="text-sm text-[#f3e6cc]">
                  {file ? file.name : "Choose a photo"}
                </span>
                <span className="mt-1 text-xs text-[#f3e6cc]/40">
                  JPEG, PNG or WebP, up to 8MB
                </span>
                <input
                  id="tryon-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <label className="flex items-start gap-3 text-xs text-[#f3e6cc]/70">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#c59e5a]"
                />
                This is a photo of myself, or of someone who has agreed to
                this, and I understand the result is an AI-generated
                approximation, not an exact representation.
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                onClick={submit}
                disabled={!file || !consent || busy}
                className="w-full bg-[#c59e5a] py-4 text-[11px] uppercase tracking-[0.25em] text-[#0b0906] disabled:opacity-40"
              >
                {busy ? "Generating your preview… (about 20 seconds)" : "Generate preview"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
