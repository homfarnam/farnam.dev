"use client";

import { useEffect } from "react";
import { useExperience } from "@/stores/experienceStore";

export function Toast() {
  const toast = useExperience((state) => state.toast);
  const showToast = useExperience((state) => state.showToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => showToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast, showToast]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className="instrument fixed top-20 left-1/2 z-50 -translate-x-1/2 animate-[line-in_500ms_ease-out] px-5 py-3 font-mono text-xs text-ember"
    >
      {toast}
    </div>
  );
}
