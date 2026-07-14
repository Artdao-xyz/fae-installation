import {
  EXHIBITION_ABOUT_INTRO,
  EXHIBITION_ABOUT_PROGRAMME,
  EXHIBITION_ABOUT_QUOTE,
  EXHIBITION_ABOUT_QUOTE_ATTRIBUTION,
} from "@/lib/site-copy";

export function InstallationExhibitionAboutContent() {
  return (
    <div className="flex w-full max-w-[645px] flex-col gap-5 font-suisseintl text-sm leading-[1.6] text-ink-primary">
      <p className="m-0 text-center">{EXHIBITION_ABOUT_INTRO}</p>

      <p className="m-0 text-center">
        {EXHIBITION_ABOUT_QUOTE} ({EXHIBITION_ABOUT_QUOTE_ATTRIBUTION})
      </p>

      <p className="m-0 text-center">
        <em className="italic">processing&hellip;</em> {EXHIBITION_ABOUT_PROGRAMME}
      </p>
    </div>
  );
}
