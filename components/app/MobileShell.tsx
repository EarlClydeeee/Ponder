/**
 * Mobile Shell — DSD §4. On ≥768px viewports, /app renders inside a centered
 * phone-ratio frame; on phones it fills the screen.
 * Owner: Ivy.
 */
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[var(--color-bg)] md:flex md:items-center md:justify-center md:p-6">
      {/* Vignette backdrop on desktop only */}
      <div
        className="pointer-events-none fixed inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(201,162,39,0.06), transparent 60%)",
        }}
      />
      <div
        className="
          relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-[var(--color-bg)]
          md:h-auto md:aspect-[9/19.5] md:max-h-[92dvh] md:w-[390px] md:max-w-[390px]
          md:rounded-[44px] md:border-8 md:border-[var(--color-surface)]
          md:shadow-[var(--shadow-lg)]
        "
      >
        {children}
      </div>
    </div>
  );
}
