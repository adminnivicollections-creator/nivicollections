import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-serif text-4xl font-light text-ink">
        Page not found
      </h1>
      <p className="mt-4 text-ink/60">
        The page you&rsquo;re looking for doesn&rsquo;t exist, or has moved.
      </p>
      <Link
        href="/"
        className="mt-10 inline-block border border-ink px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-cream"
      >
        Back to shop
      </Link>
    </div>
  );
}
