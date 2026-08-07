"use client";

export function ShareButton({
  name,
  path,
  className = "",
}: {
  name: string;
  path: string;
  className?: string;
}) {
  async function share() {
    const url = `${window.location.origin}${path}`;
    const text = `Have a look at ${name} on Nivi Collections`;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {
        // User cancelled the share sheet — fall through to a WhatsApp link.
      }
    }

    const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      aria-label="Share this product"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        share();
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-ink shadow-sm transition-transform active:scale-90 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="text-ink/70"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.5 15.4 6.5M8.6 13.5 15.4 17.5" />
      </svg>
    </button>
  );
}
