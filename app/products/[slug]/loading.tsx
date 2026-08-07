export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-48 animate-pulse bg-[#f3e6cc]/10" />
        <div className="mt-6 grid gap-12 md:grid-cols-2">
          <div className="aspect-[3/4] w-full animate-pulse bg-[#f3e6cc]/10" />
          <div>
            <div className="h-3 w-20 animate-pulse bg-[#f3e6cc]/10" />
            <div className="mt-4 h-9 w-3/4 animate-pulse bg-[#f3e6cc]/10" />
            <div className="mt-5 h-6 w-32 animate-pulse bg-[#f3e6cc]/10" />
            <div className="mt-10 h-4 w-full animate-pulse bg-[#f3e6cc]/10" />
            <div className="mt-2 h-4 w-2/3 animate-pulse bg-[#f3e6cc]/10" />
            <div className="mt-12 h-14 w-full animate-pulse bg-[#f3e6cc]/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
