/**
 * / — landing page. Narrative: hook → problem → how it works → proof → CTA.
 * Drives visitors into /app (no install). Website plan.
 * Owner: Ivy.
 */
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Science />
      <Cta />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[rgba(15,14,12,0.8)] px-6 py-4 backdrop-blur">
      <span className="font-[family-name:var(--font-display)] text-xl text-[var(--color-primary)]">
        Ponder
      </span>
      <Link
        href="/app"
        className="rounded-[14px] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-inverse)] transition hover:bg-[var(--color-primary-hover)]"
      >
        Open Ponder
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[1.1] md:text-6xl">
        Interview anything
        <br />
        you photograph.
      </h1>
      <p className="max-w-xl text-lg text-[var(--color-muted)]">
        Ponder brings paintings, statues, landmarks, and everyday objects to
        life. Ask questions by voice. Watch story slides appear as they teach.
      </p>
      <Link
        href="/app"
        className="rounded-[14px] bg-[var(--color-primary)] px-8 py-4 font-medium text-[var(--color-inverse)] transition hover:bg-[var(--color-primary-hover)]"
      >
        Open Ponder →
      </Link>
      <p className="text-[13px] text-[var(--color-muted)]">
        Free · no install
      </p>
    </section>
  );
}

function Problem() {
  const cards = [
    ["Static plaques", "Can't follow curiosity."],
    ["One-way audio", "Audio guides can't hear you."],
    ["Disconnected chat", "Search pulls you away from what you're looking at."],
  ];
  return (
    <Section eyebrow="THE PROBLEM" title="Museums weren't built for your questions.">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([title, body]) => (
          <Card key={title} title={title} body={body} />
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    ["Capture", "Photograph any subject."],
    ["Awaken", "It speaks in character with a matched voice."],
    ["Discover", "Visual slides illustrate every explanation."],
  ];
  return (
    <Section eyebrow="HOW IT WORKS" title="Point. Capture. Learn.">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(([title, body], i) => (
          <Card key={title} title={`${i + 1}. ${title}`} body={body} />
        ))}
      </div>
    </Section>
  );
}

function Science() {
  const blocks = [
    ["Dual coding", "Words + pictures beat reading alone."],
    ["Retrieval via questioning", "Asking cements memory."],
    ["Emotional engagement", "Character makes it stick."],
  ];
  return (
    <Section eyebrow="WHY IT WORKS" title="Conversation + imagery beats reading alone.">
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map(([title, body]) => (
          <Card key={title} title={title} body={body} />
        ))}
      </div>
    </Section>
  );
}

function Cta() {
  return (
    <section
      id="cta"
      className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center"
    >
      <h2 className="font-[family-name:var(--font-display)] text-4xl">
        What will you interview first?
      </h2>
      <Link
        href="/app"
        className="rounded-[14px] bg-[var(--color-primary)] px-8 py-4 font-medium text-[var(--color-inverse)] transition hover:bg-[var(--color-primary-hover)]"
      >
        Open Ponder →
      </Link>
      <p className="text-[13px] text-[var(--color-muted)]">
        Free · no install
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] px-6 py-8 text-center text-[13px] text-[var(--color-muted)]">
      Privacy · Contact · © 2026 Ponder
    </footer>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="mb-2 text-[13px] font-medium tracking-widest text-[var(--color-primary)]">
        {eyebrow}
      </p>
      <h2 className="mb-8 font-[family-name:var(--font-display)] text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
