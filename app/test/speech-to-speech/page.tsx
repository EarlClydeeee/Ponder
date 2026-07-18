"use client";

import { VoiceAgentScreen } from "./components/VoiceAgentScreen";
import { useVoiceAgent } from "./lib/useVoiceAgent";

export default function SpeechToSpeechTestPage() {
  const agent = useVoiceAgent();

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col">
        <VoiceAgentScreen agent={agent} />
      </div>
    </main>
  );
}
