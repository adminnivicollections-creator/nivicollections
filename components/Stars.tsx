export function Stars({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20">
            <defs>
              <clipPath id={`star-clip-${i}-${value}`}>
                <rect x="0" y="0" width={20 * fill} height="20" />
              </clipPath>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L10 1.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gold/40"
            />
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L10 1.5Z"
              fill="currentColor"
              className="text-gold"
              clipPath={`url(#star-clip-${i}-${value})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
