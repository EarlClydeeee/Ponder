import Image from "next/image";
import Link from "next/link";
import "./landing.css";

const tickerItems = [
  "Ask the Mona Lisa why she smiles.",
  "Your dinosaur just opened its eyes.",
  "Talk to your hero. For real.",
  "Wake up a landmark. Start a conversation.",
  "That fossil has a story. Ask it.",
];

const useCases = [
  ["🧸", "What if your favourite toy came alive?", "Talk to your toys", "A dinosaur, an action figure, a stuffed bear - each gets a voice, a personality, and time for every question.", "For kids"],
  ["🖼️", "Wake up the Mona Lisa.", "Converse with great art", "Ask why she smiles, what Leonardo was like, or how it felt to disappear from the Louvre for two years.", "Art lovers"],
  ["🦸", "Talk to your hero - for real.", "Meet the people you admire", "Point Ponder at Rizal, Marie Curie, or Einstein and have the conversation you always wished you could.", "History"],
  ["🦕", "That fossil just opened its eyes.", "Bring museum visits alive", "Let an exhibit tell you about the world it lived in, the era that shaped it, and the story behind the glass.", "Explorers"],
  ["🏛️", "Ask a landmark its secrets.", "Landmarks that talk back", "The Colosseum, the Parthenon, or the Rizal Monument can share centuries of memory in their own voice.", "Travel"],
  ["🌿", "Your whole world is waking up.", "Explore anything around you", "A shell, a leaf, a textbook planet, or a circuit board. Anything with a story can become a conversation.", "The curious"],
];

const foodSamples = [
  ["🥑", "Avocado", "Why are you good for me?", "I bring mostly monounsaturated fats, plus fibre and potassium. I make toast creamier while helping a meal feel satisfying.", "Healthy fats / Fibre"],
  ["🥚", "Egg", "What do you bring to breakfast?", "I pack complete protein, choline, and several vitamins into one small shell. I am simple, versatile, and built to fuel your morning.", "Protein / Choline"],
  ["🍌", "Banana", "Why do athletes pick you?", "My carbohydrates are easy to carry, and I contain potassium. That makes me a practical snack before or after moving your body.", "Carbohydrates / Potassium"],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Navbar />
      <Hero />
      <Ticker />
      <ConversationDemo />
      <UseCases />
      <SampleConversations />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Navbar() {
  return (
    <nav className="landing-nav" aria-label="Primary navigation">
      <div className="landing-container nav-inner">
        <Link className="nav-logo" href="#top">Ponder</Link>
        <div className="nav-links">
          <Link href="#conversation">Conversation</Link>
          <Link href="#use-cases">What to explore</Link>
          <Link href="#how-it-works">How it works</Link>
        </div>
        <Link className="nav-cta" href="/app">Open Ponder</Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="top" className="hero-section">
      <div className="landing-container hero-grid">
        <div className="hero-copy">
          <span className="hero-pill"><i /> Voice AI / Real conversations</span>
          <h1>Wake up your <em>world.</em></h1>
          <p className="landing-lead">
            Point your camera at any object, artwork, or landmark. Ponder wakes it up and lets you talk to it. Real conversations. Real answers. Your curiosity, finally met.
          </p>
          <div className="button-row">
            <Link className="landing-button primary-button" href="/app">Open Ponder <span aria-hidden="true">-&gt;</span></Link>
            <Link className="landing-button outline-button" href="#conversation">See it in action</Link>
          </div>
          <p className="hero-note">Free to start / No install / Works in your browser</p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual">
      <Image className="hero-asset hero-asset-owl" src="/demo/assets/Ponder Owl Mascot.png" alt="Ponder owl mascot" width={512} height={288} priority />
      <PhoneShowcase />
    </div>
  );
}

function PhoneShowcase() {
  return (
    <div className="phone-showcase" aria-label="Ponder product preview">
      <div className="phone phone-home">
        <div className="phone-home-art">
          <Image src="/demo/backgrounds/Home Screen Hero - Mobile.png" alt="Illustrated green landscape" fill sizes="220px" priority />
          <div className="phone-topbar"><b>Ponder</b><span>o</span></div>
        </div>
        <div className="phone-home-body">
          <p>Good morning, Explorer</p>
          <h3>What are you curious about today?</h3>
          <div className="phone-discover"><span className="camera-mark">+</span><div><b>Point and discover</b><small>Tap anything to wake it up</small></div></div>
          <strong className="recent-label">Recent conversations</strong>
          <div className="recent-grid"><span>Art</span><span>Places</span><span>Fossils</span></div>
        </div>
      </div>
      <div className="phone phone-call">
        <div className="call-header"><b>Mona Lisa</b><small>Renaissance / Florence, 1503</small><span><i /> Speaking now</span></div>
        <div className="portrait-scene" aria-hidden="true"><div className="portrait-hair" /><div className="portrait-face" /><div className="portrait-body" /></div>
        <div className="story-card"><div><b>Now</b></div><span>Florence, 1503</span></div>
        <div className="waveform" aria-hidden="true">{[1,2,3,4,5,6,7].map((bar) => <i key={bar} style={{ animationDelay: `${bar * 70}ms` }} />)}</div>
        <div className="call-controls"><button aria-label="Mute">M</button><button className="active" aria-label="Microphone">V</button><button className="end" aria-label="End conversation">X</button><button aria-label="Slides">S</button></div>
      </div>
    </div>
  );
}

function Ticker() {
  const repeated = [...tickerItems, ...tickerItems];
  return <div className="ticker" aria-hidden="true"><div className="ticker-track">{repeated.map((item, index) => <span key={`${item}-${index}`}><b>{item}</b><i /></span>)}</div></div>;
}

function ConversationDemo() {
  return (
    <section id="conversation" className="landing-section conversation-section">
      <div className="landing-container conversation-grid">
        <div>
          <Eyebrow>Real back-and-forth</Eyebrow>
          <h2>You talk. It listens.<br />It talks. <em>You learn.</em></h2>
          <p className="landing-lead">Ponder is not a search engine with a voice. Ask follow-ups, go down rabbit holes, and keep talking for as long as you are curious.</p>
          <p className="landing-body">As it speaks, Ponder draws its world, generating illustrations of places, events, and moments beside the portrait.</p>
        </div>
        <VoiceCallDemo />
      </div>
    </section>
  );
}

function VoiceCallDemo() {
  return (
    <div className="voice-demo" aria-label="Simulated voice conversation with the Mona Lisa">
      <div className="voice-demo-topbar">
        <span className="voice-live"><i /> Live voice call</span>
        <span className="voice-timer">00:42</span>
      </div>
      <div className="voice-identity">
        <h3>Mona Lisa</h3>
        <p>Renaissance / Florence, 1503</p>
      </div>
      <div className="voice-portrait-wrap">
        <div className="voice-speak-ring" />
        <div className="voice-portrait" aria-hidden="true">
          <div className="voice-hair" />
          <div className="voice-face" />
          <div className="voice-body" />
        </div>
      </div>
      <div className="voice-speaking"><i /> Mona Lisa is speaking</div>
      <div className="voice-wave" aria-hidden="true">
        {[1,2,3,4,5,6,7,8,9,10,11].map((bar) => <i key={bar} style={{ animationDelay: `${bar * 60}ms` }} />)}
      </div>
      <div className="voice-transcript" aria-label="Live voice transcript">
        <div><span>You asked</span><p>&ldquo;Who are you?&rdquo;</p></div>
        <div className="voice-answer"><span>Mona Lisa</span><p>&ldquo;I am Lisa Gherardini. The world knows me through Leonardo&apos;s portrait, but there is far more to my story than my smile.&rdquo;</p></div>
      </div>
      <div className="voice-controls" aria-label="Call controls">
        <button type="button" aria-label="Mute microphone"><span>M</span><small>Mute</small></button>
        <button type="button" className="voice-control-active" aria-label="Voice is active"><span>V</span><small>Voice</small></button>
        <button type="button" className="voice-end" aria-label="End call"><span>X</span><small>End</small></button>
        <button type="button" aria-label="Show generated visuals"><span>S</span><small>Visuals</small></button>
      </div>
    </div>
  );
}

function UseCases() {
  return (
    <section id="use-cases" className="landing-section alternate-section">
      <div className="landing-container">
        <Eyebrow>What to talk to</Eyebrow>
        <h2>Anything with a story<br />is waiting to <em>speak.</em></h2>
        <div className="use-case-grid">{useCases.map(([icon, hook, title, description, tag]) => (
          <article className="use-case-card" key={title}><span className="case-icon" aria-hidden="true">{icon}</span><p className="case-hook">{hook}</p><h3>{title}</h3><p>{description}</p><b>{tag}</b></article>
        ))}</div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["1", "Point your camera", "Aim at a painting, a toy, a page in a book, or a landmark. Ponder recognises it and builds its personality in seconds.", "/demo/assets/Floating Camera Object.png"],
    ["2", "It comes alive", "The subject wakes up with its own voice and character, introduces itself, and invites your first question.", "/demo/assets/Ponder Owl Mascot.png"],
    ["3", "Talk as long as you want", "Ask out loud. Follow up. Go deep. The conversation keeps moving and illustrations appear along the way.", "/demo/assets/Knowledge Scroll.png"],
  ];
  return (
    <section id="how-it-works" className="landing-section how-section">
      <div className="landing-container"><Eyebrow>How it works</Eyebrow><h2>Snap. Talk. <em>Wonder.</em></h2><p className="landing-lead">Three steps and you are in a conversation with anything.</p>
        <div className="steps-grid">{steps.map(([number, title, body, asset], index) => <article className="step-card" key={number}><div className="step-art"><Image className="step-asset" src={asset} alt="" width={512} height={288} aria-hidden="true" /></div><div className="step-content"><span>{number}</span><h3>{title}</h3><p>{body}</p></div>{index < 2 && <span className="step-connector" aria-hidden="true">→</span>}</article>)}</div>
      </div>
    </section>
  );
}

function SampleConversations() {
  return (
    <section className="landing-section sample-section">
      <div className="landing-container">
        <div className="sample-heading">
          <div><Eyebrow light>Sample conversations</Eyebrow><h2>What if your food could <em>explain itself?</em></h2></div>
          <p>Inspired by the joy of talking-food videos, these are the kinds of conversations Ponder can bring to life. Ask out loud and hear the answer in character.</p>
        </div>
        <div className="sample-grid">{foodSamples.map(([icon, name, question, answer, nutrients], index) => (
          <article className="sample-card" key={name}>
            <div className="sample-visual">
              <span className="sample-number">0{index + 1}</span>
              <span className="food-avatar" aria-hidden="true">{icon}</span>
              <span className="sample-speaking"><i /> Speaking</span>
              <div className="sample-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((bar) => <i key={bar} style={{ animationDelay: `${bar * 65}ms` }} />)}</div>
            </div>
            <div className="sample-copy">
              <span className="sample-food-name">{name}</span>
              <p className="sample-question"><b>You:</b> &ldquo;{question}&rdquo;</p>
              <p className="sample-answer">&ldquo;{answer}&rdquo;</p>
              <span className="sample-nutrients">{nutrients}</span>
            </div>
          </article>
        ))}</div>
        <div className="sample-action"><Link className="landing-button sample-button" href="/app">Wake up something near you <span aria-hidden="true">-&gt;</span></Link></div>
      </div>
    </section>
  );
}

function FinalCta() {
  return <section className="final-cta"><Eyebrow>The world is ready to talk</Eyebrow><h2>Point. Talk. <em>Wonder.</em></h2><p className="landing-lead">Your favourite toy has questions to answer. Your hero has things to tell you. History is ready for a conversation.</p><Link className="landing-button primary-button" href="/app">Open Ponder free <span aria-hidden="true">-&gt;</span></Link><small>Free to start / No account needed</small></section>;
}

function Footer() {
  return <footer className="landing-footer"><span>Ponder</span><small>Point. Talk. Wonder. / Built for the curious.</small></footer>;
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <span className={`landing-eyebrow ${light ? "light" : ""}`}>{children}</span>;
}
