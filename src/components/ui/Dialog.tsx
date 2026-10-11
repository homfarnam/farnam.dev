"use client";

import { useEffect, useId, useRef } from "react";

interface DialogProps {
  title: string;
  /** Small mono line above the title, e.g. a system path. */
  kicker?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: "md" | "lg";
  /** Initial focus target selector inside the dialog. */
  initialFocus?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Modal instrument panel. Traps focus, restores it on close.
 * Esc handling lives in the global keyboard controller.
 */
export function Dialog({ title, kicker, onClose, children, width = "md", initialFocus }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = panel.current;
    const first =
      (initialFocus ? root?.querySelector<HTMLElement>(initialFocus) : null) ?? root?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (!firstItem || !lastItem) return;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    root?.addEventListener("keydown", trap);
    return () => {
      root?.removeEventListener("keydown", trap);
      previouslyFocused?.focus?.();
    };
  }, [initialFocus]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-void/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`instrument relative max-h-[86vh] w-full overflow-x-hidden overflow-y-auto ${width === "lg" ? "max-w-3xl" : "max-w-xl"} animate-[panel-in_420ms_var(--ease-out-expo)]`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-line bg-navy/95 px-6 py-4">
          <div>
            {kicker ? <p className="font-mono text-xs text-cyan">{kicker}</p> : null}
            <h2 id={titleId} className="mt-1 text-xl font-medium tracking-tight">
              {title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="mt-1 shrink-0 font-mono text-xs text-mute hover:text-ink">
            Close <kbd className="ml-1 rounded border border-line px-1">Esc</kbd>
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
