"use client";

import { useEffect, useRef, useState, type Ref } from "react";

type PopUpProps = {
  mainContent: string;
  secondaryContent: string;
  cta: string;
  url: string;
  variant?: "desktop" | "mobile";
};

export function PopUp({
  mainContent,
  secondaryContent,
  cta,
  url,
  variant = "desktop",
}: PopUpProps) {
  const isExternal = /^https?:\/\//i.test(url);
  const mobile = variant === "mobile";
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState(false);

  useEffect(() => {
    if (!mobile) return;

    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;

    const update = () => {
      setMarquee(measure.scrollWidth > viewport.clientWidth);
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(viewport);
    resizeObserver.observe(measure);

    return () => resizeObserver.disconnect();
  }, [mobile, mainContent, secondaryContent, cta]);

  const content = (
    hidden = false,
    ref?: Ref<HTMLDivElement>,
    framed = false,
  ) => (
    <div
      ref={ref}
      className={[
        "inline-flex shrink-0 items-center gap-2",
        framed ? "bg-[#f7f7f7] px-[5px] py-0" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={hidden || undefined}
    >
      <div
        className="h-[2px] w-[9px] shrink-0 rotate-90 bg-(--color-filter-category-latest-updates)"
        aria-hidden
      />

      <p className="shrink-0 whitespace-nowrap font-lust-text text-xs leading-5 text-(--color-filter-category-latest-updates)">
        {mainContent}
      </p>

      <p className="shrink-0 whitespace-nowrap font-lust-text text-xs leading-5 text-(--color-filter-category-latest-updates)">
        {secondaryContent}
      </p>

      <a
        href={url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        tabIndex={hidden ? -1 : undefined}
        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-fira-mono text-xs leading-5 text-(--color-filter-category-latest-updates) underline decoration-solid [text-decoration-skip-ink:none] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-(--color-filter-category-latest-updates)"
      >
        <span>{cta}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/blue-arrow.svg"
          alt=""
          width={5}
          height={7}
          className="block h-[7px] w-[5px] shrink-0"
          aria-hidden
        />
      </a>
    </div>
  );

  if (mobile) {
    return (
      <div className="flex h-13 w-full min-w-0 items-center overflow-hidden border-t-hairline border-solid border-border bg-surface-canvas py-0">
        <div
          ref={viewportRef}
          className="min-w-0 flex-1 overflow-hidden px-3"
        >
          <div
            className={[
              "inline-flex w-max items-center gap-8",
              marquee
                ? "fae-mobile-popup-marquee motion-reduce:animate-none"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {content(false, measureRef, true)}
            {marquee ? content(true, undefined, true) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[10px] bg-[#f7f7f7] px-[5px] py-0">
      {content()}
    </div>
  );
}
