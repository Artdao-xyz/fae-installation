"use client";

type PopUpProps = {
  mainContent: string;
  secondaryContent: string;
  cta: string;
  url: string;
};

export function PopUp({ mainContent, secondaryContent, cta, url }: PopUpProps) {
  const isExternal = /^https?:\/\//i.test(url);

  return (
    <div className="flex items-center gap-[10px] bg-[#f7f7f7] px-[5px] py-0">
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
}
