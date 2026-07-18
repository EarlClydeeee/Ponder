/**
 * / — landing page. Narrative: hook → problem → how it works → proof → CTA.
 * Drives visitors into /app (no install). Website plan.
 * Owner: Ivy.
 */
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg-page)] text-[var(--text-primary)]">
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
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-default)] bg-[rgba(254,252,247,0.88)] px-6 py-4 backdrop-blur">
      <span className="ponder-logo">
        Ponder
      </span>
      <Link
        href="/app"
        className="btn-primary px-4 py-2 text-sm font-semibold"
      >
        Open Ponder
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.1] text-[var(--text-heading)] md:text-6xl">
        Interview anything
        <br />
        you photograph.
      </h1>
      <p className="max-w-xl text-lg text-[var(--text-secondary)]">
        Ponder brings paintings, statues, landmarks, and everyday objects to
        life. Ask questions by voice. Watch story slides appear as they teach.
      </p>
      <Link
        href="/app"
        className="btn-primary px-8 py-4 font-semibold"
      >
        Open Ponder →
      </Link>
      <p className="text-[13px] text-[var(--text-secondary)]">
        Free · 3 sessions/day · no install
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
      <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--text-heading)]">
        What will you interview first?
      </h2>
      <Link
        href="/app"
        className="btn-primary px-8 py-4 font-semibold"
      >
        Open Ponder →
      </Link>
      <p className="text-[13px] text-[var(--text-secondary)]">
        Free · 3 sessions/day · no install
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] px-6 py-8 text-center text-[13px] text-[var(--text-secondary)]">
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
      <p className="mb-2 font-[family-name:var(--font-display)] text-[11px] font-bold tracking-[0.08em] text-[var(--brand-primary)]">
        {eyebrow}
      </p>
      <h2 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-heading)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6">
      <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-heading)]">{title}</h3>
      <p className="text-[var(--text-secondary)]">{body}</p>
    </div>
  );
}
