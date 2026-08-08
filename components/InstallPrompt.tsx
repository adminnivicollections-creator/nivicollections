"use client";

import { useEffect, useRef, useState } from "react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissed = sessionStorage.getItem("pwa-dismissed");
    if (dismissed) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setShow(false);
  }

  function dismiss() {
    sessionStorage.setItem("pwa-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-[#c59e5a]/30 bg-[#0b0906] p-4 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#f3e6cc]">
          Install Nivi Collections
        </p>
        <p className="mt-0.5 text-xs text-[#f3e6cc]/60">
          Add to home screen for a faster, app-like experience
        </p>
      </div>
      <button
        onClick={install}
        className="shrink-0 bg-[#c59e5a] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#0b0906]"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[#f3e6cc]/40 hover:text-[#f3e6cc]"
      >
        &times;
      </button>
    </div>
  );
}
