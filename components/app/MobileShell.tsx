/**
 * Mobile Shell — constrains /app to a phone-width column, centered on wider
 * viewports. No device bezel/border/padding — just the mobile ratio; on phones
 * it fills the screen.
 * Owner: Ivy.
 */
import type { ReactNode } from "react";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-[var(--color-bg)]">
      <div className="flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-[var(--color-bg)]">
        {children}
      </div>
    </div>
  );
}
