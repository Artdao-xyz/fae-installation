'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type EmblaCarouselProps = {
  children?: React.ReactNode[] | React.ReactNode;
  options?: EmblaOptionsType;
  className?: string;
  placeholders?: string[]; // Fallback images when no children provided
};

export function EmblaCarousel({ children, options, className, placeholders }: EmblaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const defaultPlaceholders = placeholders && placeholders.length > 0
    ? placeholders
    : [
        'https://picsum.photos/seed/embla1/1200/600',
        'https://picsum.photos/seed/embla2/1200/600',
        'https://picsum.photos/seed/embla3/1200/600',
      ];

  const slides = React.Children.count(children) > 0
    ? React.Children.toArray(children)
    : defaultPlaceholders.map((src, idx) => (
        <div className="w-full h-full max-h-80">
          <img
            src={src}
            alt={`Placeholder ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ));

  return (
    <div className={`relative ${className || ''}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((child, idx) => (
            <div className="flex-[0_0_100%] min-w-0">{child}</div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          aria-label="Previous slide"
          className={`cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-white/80 border border-black transition hover:bg-white ${
            canPrev ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
          disabled={!canPrev}
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Next slide"
          className={`cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-white/80 border border-black transition hover:bg-white ${
            canNext ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
          }`}
          disabled={!canNext}
          onClick={() => emblaApi?.scrollNext()}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}


