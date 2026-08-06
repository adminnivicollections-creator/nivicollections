import { SHIPPING, BUSINESS, formatINR } from "@/lib/config";

const ICONS = {
  shield: (
    <path d="M12 2 4 5v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V5l-8-3Zm0 9.5 3-3 1.4 1.4L12 14.3l-4.4-4.4L9 8.5l3 3Z" />
  ),
  returns: (
    <path d="M4 4v6h6M4.5 13a8 8 0 1 0 2.3-6.7L4 9" fill="none" strokeWidth="1.6" stroke="currentColor" />
  ),
  badge: (
    <path d="M12 2 3 6v6c0 5.2 3.8 9.2 9 10 5.2-.8 9-4.8 9-10V6l-9-4Zm-1.2 13.4L7 11.6l1.4-1.4 2.4 2.4 5.4-5.4L17.6 8.6l-6.8 6.8Z" />
  ),
  truck: (
    <path
      d="M2 6h11v9H2zm11 3h4l3 3v3h-7zM6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      fill="none"
      strokeWidth="1.4"
      stroke="currentColor"
    />
  ),
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export function TrustBar({ dark = false }: { dark?: boolean }) {
  const items: { icon: keyof typeof ICONS; label: string }[] = [
    { icon: "shield", label: "Secure payments via Razorpay" },
    { icon: "returns", label: `${BUSINESS.returnWindowDays}-day easy returns` },
    { icon: "badge", label: "Authentic, handcrafted pieces" },
    { icon: "truck", label: `Free shipping above ${formatINR(SHIPPING.freeAbovePaise)}` },
  ];

  const text = dark ? "text-[#f3e6cc]" : "text-ink";
  const iconColor = dark ? "text-[#c59e5a]" : "text-gold";
  const border = dark ? "border-[#c59e5a]/15" : "border-ink/10";

  return (
    <ul
      className={`grid grid-cols-2 gap-x-4 gap-y-6 border-y ${border} px-5 py-8 text-center sm:grid-cols-4`}
    >
      {items.map((item) => (
        <li key={item.label} className="flex flex-col items-center gap-2">
          <span className={iconColor}>
            <Icon name={item.icon} />
          </span>
          <span className={`text-xs leading-snug ${text}`}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
