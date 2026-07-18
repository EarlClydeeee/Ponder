/**
 * Slide Carousel — DSD §4. Horizontal snap scroll, 16:9 cards with captions.
 * Skeleton while generating; caption card on failure.
 * Owner: Ivy.
 */
import Image from "next/image";
import type { SlideDeck } from "@/src/engine/types";

export function SlideCarousel({ deck }: { deck: SlideDeck | null }) {
  if (!deck) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[var(--color-muted)]">
        Slides will appear as the story unfolds.
      </div>
    );
  }

  if (deck.status === "generating") {
    return (
      <div className="flex h-full items-center gap-3 overflow-hidden px-1">
        <div className="animate-shimmer h-full flex-1 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <p className="shrink-0 text-[13px] text-[var(--color-accent)]">
          Painting the story…
        </p>
      </div>
    );
  }

  if (deck.status === "failed" || deck.slides.length === 0) {
    return (
      <div className="flex h-full items-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[13px] text-[var(--color-muted)]">
        {deck.topic}
      </div>
    );
  }

  return (
    <div className="flex h-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {deck.slides
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((slide) => (
          <figure
            key={slide.orderIndex}
            className="animate-slide-enter relative flex h-full aspect-video shrink-0 snap-center flex-col overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="relative flex-1">
              <Image
                src={slide.imageUrl}
                alt={slide.caption}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <figcaption className="border-t border-[var(--color-border)] px-3 py-2 text-[13px] text-[var(--color-muted)]">
              {slide.caption}
            </figcaption>
          </figure>
        ))}
    </div>
  );
}
