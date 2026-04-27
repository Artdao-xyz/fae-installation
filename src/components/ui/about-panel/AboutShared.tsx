import { EmailSubscription } from "@/components/ui/email-subscription";

/**
 * Shared About copy for desktop full-screen, mobile sheet, and dock peek body.
 */

export const ABOUT_BODY = (
  <>
    <p className="mb-0 leading-[1.6]">
      Future Art Ecosystems is a project for building 21st century cultural
      infrastructure to support art and advanced technologies for the public good.
    </p>
    <p className="mb-0 leading-[1.6]">&nbsp;</p>
    <p className="mb-0 leading-[1.6]">
      Through briefings, R&amp;D Labs and a growing community of artists,
      technologists, policy-makers, researchers and fellow organisations, FAE
      develops insights, tools and projects that advance our mission.
    </p>
  </>
);

export const ABOUT_FULL_TEAM = [
  "Tamar Clarke-Brown",
  "Tommie Introna",
  "Victoria Ivanova",
  "Eva Jäger",
  "Lina Martin-Chan",
  "Vi Trinh",
  "Ruth Waters",
  "Kay Watson",
] as const;

/** Long-form About body (team, links) — same blocks as desktop full-screen. */
export function AboutPanelRichContent() {
  return (
    <div className="flex w-full flex-col items-start gap-5 text-ink-body">
      <div className="w-full font-suisseintl text-xs font-normal leading-5">
        {ABOUT_BODY}
      </div>

      <ul className="m-0 w-full list-none p-0 font-suisseintl text-xs font-normal leading-5">
        {ABOUT_FULL_TEAM.map((name) => (
          <li key={name} className="p-0">
            {name}
          </li>
        ))}
      </ul>

      <p className="mb-0 font-suisseintl text-xs font-normal leading-5">
        You can explore our Twitch archive, or tune in live for special events.
        To get more involved, join our Telegram community and take part in our
        quarterly Community Call. For partnerships and other inquiries, please
        email us.
      </p>

      <EmailSubscription className="w-full" />

      <nav
        className="flex flex-wrap items-center gap-x-5 gap-y-2 font-fira-mono text-xs font-normal text-ink-body"
        aria-label="Social and community links"
      >
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          Twitch
        </a>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          Telegram
        </a>
        <a
          href="#"
          className="underline decoration-solid underline-offset-2 hover:opacity-80"
        >
          X
        </a>
      </nav>
    </div>
  );
}
