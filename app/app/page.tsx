/**
 * /app — the product. Mobile-shell experience: capture → awaken → converse.
 * Owner: Ivy (shell/routing), David (engine binding).
 */
"use client";

import { useState } from "react";
import { MobileShell } from "@/components/app/MobileShell";
import { CaptureScreen } from "@/components/app/CaptureScreen";
import { ConversationScreen } from "@/components/app/ConversationScreen";
import { useLivingPortrait } from "@/src/hooks/useLivingPortrait";
import type { AwakenConfig } from "@/src/engine/types";

export default function AppPage() {
  const portrait = useLivingPortrait();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function handleAwaken(config: AwakenConfig) {
    setPhotoUrl(config.photoDataUrl);
    void portrait.awaken(config);
  }

  function handleExit() {
    portrait.endSession();
    setPhotoUrl(null);
  }

  const inConversation = portrait.phase !== "idle";

  return (
    <MobileShell>
      {inConversation ? (
        <ConversationScreen
          portrait={portrait}
          photoUrl={photoUrl}
          onExit={handleExit}
        />
      ) : (
        <CaptureScreen onAwaken={handleAwaken} />
      )}
    </MobileShell>
  );
}
