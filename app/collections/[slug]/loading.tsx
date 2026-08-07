export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <div className="mx-auto h-4 w-40 animate-pulse bg-ink/10" />
      <div className="mx-auto mt-6 h-9 w-64 animate-pulse bg-ink/10" />
      <div className="mx-auto mt-4 h-4 w-24 animate-pulse bg-ink/10" />
      <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] w-full animate-pulse bg-ink/10" />
            <div className="mt-4 h-4 w-3/4 animate-pulse bg-ink/10" />
            <div className="mt-2 h-4 w-1/3 animate-pulse bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
