import Link from "next/link";

export function Breadcrumbs({
  items,
  dark = false,
}: {
  items: { label: string; href?: string }[];
  dark?: boolean;
}) {
  const text = dark ? "text-[#f3e6cc]/50" : "text-ink/50";
  const hover = dark ? "hover:text-[#f3e6cc]" : "hover:text-ink";
  const current = dark ? "text-[#f3e6cc]/80" : "text-ink/80";

  return (
    <nav aria-label="Breadcrumb" className={`text-xs ${text}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className={hover}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={current}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
