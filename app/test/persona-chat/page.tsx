"use client";

/**
 * Persona-chat feature sandbox: photo -> robust persona -> grounded text chat.
 * Owner: Ivy (harness UI), David/Shello (shared persona-chat pipeline).
 * Sources: PRD US-01/US-04, DSD sections 2-6, QAD AI-01/AI-02/AI-04/AI-06.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  generatePersona,
  sendPersonaChat,
} from "@/src/engine/personaChat";
import type {
  PersonaCitation,
  PersonaProfile,
  TranscriptTurn,
} from "@/src/engine/types";
import { fileToDownscaledDataUrl } from "@/src/lib/image";

interface ChatMessage extends TranscriptTurn {
  usedWebSearch?: boolean;
  citations?: PersonaCitation[];
  streaming?: boolean;
}

export default function PersonaChatTestPage() {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  async function handlePhoto(file: File | undefined) {
    if (!file) return;

    setError(null);
    setProfile(null);
    setMessages([]);
    setDraft("");
    setIsAnalyzing(true);

    try {
      const dataUrl = await fileToDownscaledDataUrl(file);
      setPhotoDataUrl(dataUrl);
      const generatedProfile = await generatePersona(dataUrl);
      setProfile(generatedProfile);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: generatedProfile.greeting,
          at: new Date().toISOString(),
        },
      ]);
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMessage = draft.trim();
    if (!profile || !userMessage || isSending) return;

    const history: TranscriptTurn[] = messages.map(({ id, role, text, at }) => ({
      id,
      role,
      text,
      at,
    }));
    const userTurn: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: userMessage,
      at: new Date().toISOString(),
    };
    const assistantId = crypto.randomUUID();
    const assistantTurn: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      at: new Date().toISOString(),
      streaming: true,
      citations: [],
    };

    setDraft("");
    setError(null);
    setIsSending(true);
    setMessages((current) => [...current, userTurn, assistantTurn]);

    try {
      const response = await sendPersonaChat(profile, history, userMessage, {
        onDelta: (delta) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, text: message.text + delta }
                : message,
            ),
          );
        },
        onWebSearch: () => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, usedWebSearch: true }
                : message,
            ),
          );
        },
        onCitation: (citation) => {
          setMessages((current) =>
            current.map((message) => {
              if (message.id !== assistantId) return message;
              const citations = message.citations ?? [];
              if (citations.some((item) => item.url === citation.url)) {
                return message;
              }
              return { ...message, citations: [...citations, citation] };
            }),
          );
        },
      });
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: response.reply,
                usedWebSearch: response.usedWebSearch,
                citations: response.citations,
                streaming: false,
              }
            : message,
        ),
      );
    } catch (caught) {
      setMessages((current) =>
        current.flatMap((message) => {
          if (message.id !== assistantId) return [message];
          return message.text ? [{ ...message, streaming: false }] : [];
        }),
      );
      setError(readableError(caught));
    } finally {
      setIsSending(false);
    }
  }

  function reset() {
    setPhotoDataUrl(null);
    setProfile(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setIsAnalyzing(false);
    setIsSending(false);
  }

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] px-4 py-5 text-[var(--color-text)] sm:px-5">
      <div className="mx-auto flex w-full max-w-[390px] flex-col gap-5">
        <header className="flex min-h-14 items-center justify-between gap-3">
          <a
            href="/app"
            className="flex min-h-14 items-center rounded-xl px-2 text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Back
          </a>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Feature sandbox
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Persona chat</p>
          </div>
        </header>

        {!profile && (
          <CaptureCard
            photoDataUrl={photoDataUrl}
            isAnalyzing={isAnalyzing}
            onPhoto={(file) => void handlePhoto(file)}
          />
        )}

        {error && <ErrorCard message={error} />}

        {profile && photoDataUrl && (
          <>
            <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
              <div className="relative h-44 w-full">
                <Image
                  src={photoDataUrl}
                  alt={`Photo used to create ${profile.subjectLabel}`}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-[var(--color-surface)]/90 px-4 py-3 backdrop-blur-sm">
                  <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {profile.subjectLabel}
                  </p>
                  <p className="mt-1 text-xs capitalize text-[var(--color-muted)]">
                    {profile.category} · {profile.identityConfidence} identity confidence
                  </p>
                </div>
              </div>
            </section>

            <PersonaInspector profile={profile} />

            <section aria-labelledby="conversation-title" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-primary)]">
                    Live thread
                  </p>
                  <h1
                    id="conversation-title"
                    className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold"
                  >
                    Ask {profile.subjectLabel}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-14 shrink-0 rounded-xl border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                  New photo
                </button>
              </div>

              <div className="space-y-3" aria-live="polite">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isSending && !messages.some((message) => message.streaming) && (
                  <div className="flex justify-start" role="status">
                    <div className="rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
                      {profile.subjectLabel} is thinking…
                    </div>
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>

              <form onSubmit={handleSend} className="sticky bottom-0 bg-[var(--color-bg)] py-3">
                <label htmlFor="persona-message" className="sr-only">
                  Message {profile.subjectLabel}
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    id="persona-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    disabled={isSending}
                    rows={1}
                    placeholder="Ask a question…"
                    className="min-h-14 flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !draft.trim()}
                    className="min-h-14 rounded-xl bg-[var(--color-primary)] px-5 font-semibold text-[var(--color-inverse)] transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function CaptureCard({
  photoDataUrl,
  isAnalyzing,
  onPhoto,
}: {
  photoDataUrl: string | null;
  isAnalyzing: boolean;
  onPhoto: (file: File | undefined) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
      {photoDataUrl ? (
        <div className={`relative aspect-[4/3] w-full border-b border-[var(--color-border)] ${isAnalyzing ? "animate-shimmer" : ""}`}>
          <Image
            src={photoDataUrl}
            alt="Selected subject"
            fill
            unoptimized
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/55 px-6 text-center">
            <div role="status">
              <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                Analyzing…
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Building identity, memories, knowledge, and boundaries.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Photo to persona
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
            Meet what you see
          </h1>
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[var(--color-muted)]">
            Photograph or upload one artwork, place, animal, food, or everyday object. Ponder will build a grounded character you can question.
          </p>
        </div>
      )}

      <div className="p-5">
        <label
          className={`flex min-h-14 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[var(--color-primary)] px-6 text-center font-semibold text-[var(--color-inverse)] transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)] ${isAnalyzing ? "pointer-events-none opacity-50" : "hover:bg-[var(--color-primary-hover)]"}`}
        >
          <span>{isAnalyzing ? "Creating persona…" : "Choose or take a photo"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={isAnalyzing}
            className="sr-only"
            onChange={(event) => {
              onPhoto(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <p className="mt-3 text-center text-xs leading-5 text-[var(--color-muted)]">
          Images are downscaled to 1024px before analysis. This sandbox keeps the session only in memory.
        </p>
      </div>
    </section>
  );
}

function PersonaInspector({ profile }: { profile: PersonaProfile }) {
  return (
    <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
        <span>
          <span className="block text-sm font-semibold">Persona inspector</span>
          <span className="mt-1 block text-xs text-[var(--color-muted)]">
            Judge grounding and character quality
          </span>
        </span>
        <span className="rounded-full border border-[var(--color-primary)] px-2 py-1 text-xs capitalize text-[var(--color-primary)]">
          {profile.identityConfidence}
        </span>
      </summary>

      <div className="space-y-5 border-t border-[var(--color-border)] px-4 py-5">
        <InspectorField label="Category & voice">
          <p className="capitalize">
            {profile.category} · {profile.voice}
          </p>
          <p className="mt-1 text-[var(--color-muted)]">{profile.speakingStyle}</p>
        </InspectorField>

        <InspectorField label="Personality">
          <TagList items={profile.personality.traits} />
          <p className="mt-3 text-[var(--color-muted)]">
            {profile.personality.demeanor} Humor: {profile.personality.humorStyle}
          </p>
          <List items={profile.personality.quirks} />
        </InspectorField>

        <InspectorField label="First-person memories">
          <List items={profile.memories} />
        </InspectorField>

        <InspectorField label="Key facts">
          <List items={profile.keyFacts} />
        </InspectorField>

        <InspectorField label="Expertise">
          <TagList items={profile.expertise} />
        </InspectorField>

        <InspectorField label="Boundaries">
          <List items={profile.boundaries} />
        </InspectorField>

        <InspectorField label="Slide style hint">
          <p className="text-[var(--color-muted)]">{profile.styleHint}</p>
        </InspectorField>
      </div>
    </details>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
        {label}
      </h2>
      <div className="text-sm leading-6">{children}</div>
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2 text-[var(--color-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-[var(--color-primary)]" aria-hidden="true">
            ·
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        aria-busy={message.streaming || undefined}
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "rounded-br-sm bg-[var(--color-border)] text-[var(--color-text)]"
            : "rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
      >
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {message.text || (message.streaming ? "Thinking..." : "")}
          {message.streaming && message.text && (
            <span aria-hidden="true" className="text-[var(--color-primary)]">
              {" |"}
            </span>
          )}
        </p>

        {message.usedWebSearch && (
          <span className="mt-3 inline-flex rounded-full border border-[var(--color-primary)] px-2 py-1 text-xs text-[var(--color-primary)]">
            {message.streaming ? "Searching the web..." : "Searched the web"}
          </span>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Sources
            </p>
            <ol className="mt-2 space-y-2">
              {message.citations.map((citation, index) => (
                <li key={citation.url} className="text-xs leading-5">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-primary)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    {index + 1}. {citation.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </article>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-error)]"
    >
      {message}
    </div>
  );
}

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
