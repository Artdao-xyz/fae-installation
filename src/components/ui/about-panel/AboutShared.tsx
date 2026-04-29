"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { expandNewsletterSubscription } from "@/components/ui/email-subscription";
import {
  filterPillLabelBoxClass,
  interactiveChromeMatClass,
} from "@/components/ui/filter-sidebar/primitives/filterFramedClasses";

/**
 * Shared About copy for desktop full-screen, mobile sheet, and dock peek body.
 */

export const ABOUT_BODY = (
  <>
    <p className="m-0 line-clamp-6 whitespace-pre-line leading-[1.6]">
      Future Art Ecosystems is an initiative for building twenty-first century
      cultural infrastructure in support of practices that emerge from the
      superimposition of art and advanced technologies.
    </p>
  </>
);

const KEY_AREAS = [
  {
    title: "Advanced Production Capabilities",
    body: "We advocate for independent, in-house and production models to advance the development of AxAT practices.",
    iconSrc: "/svg/advanced-production-capabilities.svg",
  },
  {
    title: "Protocols for Organisational Interoperability",
    body: "We devise new benchmarks and systems for substantial, enduring collaborations between organisations across a plurality of cultural, technological and civic ecosystems.",
    iconSrc: "/svg/protocols-for-organisational-interoperability.svg",
  },
  {
    title: "New Ownership & Distribution Models:",
    body: "We prototype new models for generative and equitable value distribution in support of producers and their communities.",
    iconSrc: "/svg/new-ownership-distribution-models.svg",
  },
  {
    title: "New Metrics of Value & Success",
    body: "We develop new measurement systems for evaluating the public value of AxAT, moving beyond footfall and media visibility as the dominant metrics of success.",
    iconSrc: "/svg/new-metrics-of-value-success.svg",
  },
] as const;

const CURRENT_TEAM = [
  "Tamar Clarke-Brown",
  "Tommie Introna",
  "Eva Jäger",
  "Lina Martin-Chan",
  "Vi Trinh",
  "Ruth Waters",
  "Tsige Tafesse",
  "Isobel Peyton-Jones",
  "Kay Watson",
] as const;

const PAST_TEAM = [
  "Alexander Boyes",
  "Victoria Ivanova",
  "Sophie Netchaef",
  "Ben Vickers",
] as const;

const SOCIAL_LINKS = [
  {
    label: "Serpentine",
    href: "https://www.serpentinegalleries.org/",
    imageSrc: "/svg/serpentine.svg",
    imageWidth: 50,
    imageHeight: 20,
    imageClassName: "h-4",
  },
  {
    label: "Twitch",
    href: "https://www.twitch.tv/serpentineuk",
    imageSrc: "/svg/twitch.svg",
    imageWidth: 50,
    imageHeight: 20,
  },
  {
    label: "GitHub",
    href: "https://github.com/serpentinegalleries",
    imageSrc: "/svg/github.svg",
    imageWidth: 50,
    imageHeight: 20,
    imageClassName: "h-7",
  },
] as const;

const SQUARE_MARKER_SIZE = 2;
const SQUARE_CORNER_POSITIONS = [
  "left-0 top-0 -translate-x-px -translate-y-px",
  "right-0 top-0 translate-x-px -translate-y-px",
  "left-0 bottom-0 -translate-x-px translate-y-px",
  "right-0 bottom-0 translate-x-px translate-y-px",
] as const;

function AboutSubtitle({
  children,
  level = 2,
}: {
  children: ReactNode;
  level?: 2 | 3;
}) {
  const Tag = level === 3 ? "h3" : "h2";

  return (
    <Tag className="m-0 w-fit max-w-full">
      <span className="relative isolate inline-flex items-center justify-center">
        {SQUARE_CORNER_POSITIONS.map((positionClass, i) => (
          <svg
            key={i}
            width={SQUARE_MARKER_SIZE}
            height={SQUARE_MARKER_SIZE}
            viewBox={`0 0 ${SQUARE_MARKER_SIZE} ${SQUARE_MARKER_SIZE}`}
            shapeRendering="crispEdges"
            className={`pointer-events-none absolute z-0 block shrink-0 text-ink-primary ${positionClass}`}
            aria-hidden
          >
            <rect
              width={SQUARE_MARKER_SIZE}
              height={SQUARE_MARKER_SIZE}
              x={0}
              y={0}
              fill="currentColor"
            />
          </svg>
        ))}
        <span
          className={`relative z-10 box-border inline-flex items-center justify-center ${filterPillLabelBoxClass} line-clamp-2 ${interactiveChromeMatClass} border-hairline border-solid border-ink-primary text-ink-primary`}
        >
          {children}
        </span>
      </span>
    </Tag>
  );
}

function AboutContentPiece({
  title,
  children,
  level = 2,
}: {
  title: ReactNode;
  children: ReactNode;
  level?: 2 | 3;
}) {
  const Tag = level === 3 ? "article" : "section";

  return (
    <Tag className="flex w-full flex-col gap-2.5 font-suisseintl text-xs font-normal leading-5">
      <AboutSubtitle level={level}>{title}</AboutSubtitle>
      {children}
    </Tag>
  );
}

/** Long-form About body (team, links) — same blocks as desktop full-screen. */
export function AboutPanelRichContent() {
  return (
    <div className="flex w-full flex-col items-start gap-5 text-ink-body">
      <AboutContentPiece title="Mission Statement">
        <p className="m-0">
          Future Art Ecosystems is an initiative for building twenty-first
          century cultural infrastructure in support of practices that emerge
          from the superimposition of art and advanced technologies.
        </p>
        <p className="m-0">
          Through creative research and development, including fellowships,
          prototypes, briefings, labs, gatherings and a community of artists,
          technologists, researchers and peer organisations, Future Art
          Ecosystems develops insights, tools and artistic commissions that
          advance this vision. Embedded within Serpentine’s Arts Technologies
          team, Future Art Ecosystems excavates new spaces for art, technology
          and society to flourish, delivering on plural forms of public value.
        </p>
      </AboutContentPiece>

      <AboutContentPiece title="Key Areas">
        <p className="m-0">
          Our research and partnerships span across four key areas where art and
          advanced technology (AxAT) practices can lead to meaningful
          infrastructural transformations in culture and beyond:
        </p>
      </AboutContentPiece>

      {KEY_AREAS.map((area) => (
        <AboutContentPiece key={area.title} title={area.title} level={3}>
          <p className="m-0">{area.body}</p>
        </AboutContentPiece>
      ))}

      <AboutContentPiece title="History">
        <p className="m-0">
          In 2014, Serpentine established the Arts Technologies department to
          lead on commissioning and production of artworks that engage with
          advanced technologies. What followed was a series of collaborations
          with artists James Bridle, Ian Cheng, Jenna Sutela, Hito Steyerl and
          Jakob Kudsk Steensen, leading to the development of new experimental
          artworks that deployed a variety of technologies, from AI and
          blockchains to game engines and VR.
        </p>
        <p className="m-0">
          Each piece relied on the development of bespoke hybrid teams,
          technological systems and legal agreements, all of which offered unique
          insights into these technologies while making evident the operational
          limitations of undertaking this type of cultural production in the
          context of a ‘legacy’ art institution. It was the coupling of the
          opportunity to shine light on the R&amp;D potential of artistic
          production processes with the challenge of imagining new
          infrastructures to better support the evolving art and advanced
          technologies ecosystem that led to the emergence of Future Art
          Ecosystems.
        </p>
        <p className="m-0">
          In close collaboration with Rival Strategy, the Arts Technologies team
          launched the annual FAE strategic briefings with our first publication,
          Future Art Ecosystems Volume 1: Art x Advanced Technologies in 2020.
          In the years since, FAE has produced four subsequent publications to
          accompany these annual briefings, each focusing on critical areas of
          research and activity, including Art x Metaverse, Art x Decentralised
          Tech, Art x Public AI and Art x Creative R&amp;D.
        </p>
        <p className="m-0">
          Rooted in conversations with a diverse network of participants, the
          briefings have become widely shared resources that inform the practices
          and long-term strategies of artists, institutions and the wider
          cultural ecosystem, highlighting the importance of FAE itself as a
          project oriented around ecosystems. Today, FAE builds on the insights
          gained through the strategic briefings to host R&amp;D fellowships,
          develop partnerships and facilitate projects that are focused on the
          key priority areas for art x advanced technologies infrastructural
          development.
        </p>
        <p className="m-0">
          Together with a wide range of collaborators, ranging from cultural
          institutions, artists, producers, curators, researchers and
          technologists, to businesses, policy makers and mission-oriented
          organisations, we’re committed to researching, prototyping and building
          twenty-first century cultural infrastructure in support of practices
          that emerge from the superimposition of art and advanced technologies.
        </p>
      </AboutContentPiece>

      <AboutContentPiece title="Team">
        <p className="m-0">
          Current: {CURRENT_TEAM.join(", ")}. Future Art Ecosystems is initiated
          by and situated within the Arts Technologies department at Serpentine,
          London, UK.
        </p>
        <p className="m-0">Past: {PAST_TEAM.join(", ")}.</p>
      </AboutContentPiece>

      <AboutContentPiece title="Links">
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2 font-fira-mono text-xs font-normal text-ink-body"
          aria-label="Social and community links"
        >
          <a
            href="https://www.serpentinegalleries.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid underline-offset-2 hover:opacity-80"
          >
            Serpentine
          </a>
          <a
            href="https://www.twitch.tv/serpentineuk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid underline-offset-2 hover:opacity-80"
          >
            Twitch Archive
          </a>
          <a
            href="https://github.com/serpentinegalleries"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid underline-offset-2 hover:opacity-80"
          >
            GitHub
          </a>
        </nav>
        <p className="m-0">
          To get more involved, join our{" "}
          <a
            href="https://t.me/+RpackhOIPmQyODY0"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid underline-offset-2 hover:opacity-80"
          >
            Telegram community
          </a>
          , sign up to our{" "}
          <button
            type="button"
            onClick={expandNewsletterSubscription}
            className="inline cursor-pointer border-0 bg-transparent p-0 text-inherit underline decoration-solid underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
          >
            monthly newsletter
          </button>{" "}
          and take part in our quarterly{" "}
          <a
            href="https://serpentinegalleries.ticketing.veevartapp.com/tickets/view/list/future-art-ecosystems-community-call-05032026"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-solid underline-offset-2 hover:opacity-80"
          >
            Community Call
          </a>
          . For partnerships and other inquiries, please email us.
        </p>
      </AboutContentPiece>
    </div>
  );
}

function AboutSectionDivider() {
  return <div className="h-0 w-full border-t-hairline border-dotted border-[#414141]" aria-hidden />;
}

function AboutSectionHeading({
  title,
  collapsible = false,
  expanded = true,
  onToggle,
}: {
  title: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const heading = (
    <h2 className="m-0 font-lust-text text-sm leading-5 tracking-[-0.228px] text-ink-body">
      {title}
    </h2>
  );

  if (!collapsible) {
    return <div className="flex w-full items-center justify-between gap-4">{heading}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
      aria-expanded={expanded}
      aria-controls="about-history-content"
    >
      {heading}
      <Image
        src="/svg/open.svg"
        alt=""
        width={10}
        height={10}
        unoptimized
        className={`pointer-events-none h-[10px] w-auto shrink-0 transition-transform ${expanded ? "rotate-90" : "rotate-0"}`}
        aria-hidden
      />
    </button>
  );
}

function AboutTeamList({ members }: { members: readonly string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {members.map((member) => (
        <li key={member} className="flex items-center gap-2">
          <Image
            src="/svg/right-arrow.svg"
            alt=""
            width={8}
            height={6}
            unoptimized
            className="pointer-events-none h-[6px] w-2 shrink-0"
            aria-hidden
          />
          <span className="font-suisseintl text-xs leading-5 text-ink-primary">{member}</span>
        </li>
      ))}
    </ul>
  );
}

function AboutKeyAreaCard({
  title,
  body,
  iconSrc,
}: {
  title: string;
  body: string;
  iconSrc: string;
}) {
  return (
    <article className="flex h-full min-h-[130px] flex-col">
      <header className="flex items-center gap-2 border-hairline border-solid border-ink-primary bg-surface-canvas px-2.5 py-1.5">
        <Image
          src={iconSrc}
          alt=""
          width={16}
          height={16}
          unoptimized
          className="pointer-events-none h-4 w-auto shrink-0"
          aria-hidden
        />
        <h3 className="m-0 font-suisseintl text-xs leading-5 text-ink-body">{title}</h3>
      </header>
      <div className="flex flex-1 border-r-hairline border-b-hairline border-l-hairline border-solid border-ink-primary px-2.5 py-2.5">
        <p className="m-0 font-suisseintl text-xs leading-[1.6] text-ink-primary">{body}</p>
      </div>
    </article>
  );
}

function AboutActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-[2px] font-fira-mono text-xs leading-[14px] text-ink-body underline decoration-solid underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
    >
      <span>{children}</span>
      <Image
        src="/svg/blue-arrow.svg"
        alt=""
        width={5}
        height={6}
        unoptimized
        className="pointer-events-none h-[6px] w-[5px] shrink-0"
        aria-hidden
      />
    </a>
  );
}

export function AboutFullScreenRichContent() {
  const [historyExpanded, setHistoryExpanded] = useState(true);

  return (
    <div className="flex w-full max-w-[645px] flex-col gap-5 text-ink-primary">
      <header className="w-full">
        <h1 className="m-0 font-lust-text text-xl leading-none tracking-[-0.38px] text-black-fae">
          Future Art Ecosystems
        </h1>
      </header>

      <section className="flex w-full flex-col gap-2.5">
        <AboutSectionHeading title="Mission Statement" />
        <AboutSectionDivider />
        <div className="font-suisseintl text-xs leading-[1.6] text-ink-primary">
          <p className="m-0">
            Future Art Ecosystems is an initiative for building twenty-first
            century cultural infrastructure in support of practices that emerge
            from the superimposition of art and advanced technologies.
          </p>
          <p className="m-0 mt-5">
            Through creative research and development, including fellowships,
            prototypes, briefings, labs, gatherings and a community of artists,
            technologists, researchers and peer organisations, Future Art
            Ecosystems develops insights, tools and artistic commissions that
            advance this vision. Embedded within Serpentine’s Arts Technologies
            team, Future Art Ecosystems excavates new spaces for art, technology
            and society to flourish, delivering on plural forms of public value.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col gap-3.5">
        <div className="flex w-full flex-col gap-2.5">
          <AboutSectionHeading title="Key Areas" />
          <AboutSectionDivider />
        </div>
        <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2">
          {KEY_AREAS.map((area) => (
            <AboutKeyAreaCard
              key={area.title}
              title={area.title}
              body={area.body}
              iconSrc={area.iconSrc}
            />
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-2.5">
        <AboutSectionDivider />
        <AboutSectionHeading
          title="History"
          collapsible
          expanded={historyExpanded}
          onToggle={() => setHistoryExpanded((v) => !v)}
        />
        <AboutSectionDivider />
        <div
          id="about-history-content"
          hidden={!historyExpanded}
          className="font-suisseintl text-xs leading-[1.6] text-ink-primary"
        >
          <p className="m-0">
            In 2014, Serpentine established the Arts Technologies department to
            lead on commissioning and production of artworks that engage with
            advanced technologies. What followed was a series of collaborations
            with artists James Bridle, Ian Cheng, Jenna Sutela, Hito Steyerl and
            Jakob Kudsk Steensen, leading to the development of new experimental
            artworks that deployed a variety of technologies, from AI and
            blockchains to game engines and VR.
          </p>
          <p className="m-0 mt-5">
            Each piece relied on the development of bespoke hybrid teams,
            technological systems and legal agreements, all of which offered
            unique insights into these technologies while making evident the
            operational limitations of undertaking this type of cultural
            production in the context of a ‘legacy’ art institution. It was the
            coupling of the opportunity to shine light on the R&amp;D potential
            of artistic production processes with the challenge of imagining new
            infrastructures to better support the evolving art and advanced
            technologies ecosystem that led to the emergence of Future Art
            Ecosystems.
          </p>
          <p className="m-0 mt-5">
            In close collaboration with Rival Strategy, the Arts Technologies
            team launched the annual FAE strategic briefings with our first
            publication, Future Art Ecosystems Volume 1: Art x Advanced
            Technologies in 2020. In the years since, FAE has produced four
            subsequent publications to accompany these annual briefings, each
            focusing on critical areas of research and activity, including Art x
            Metaverse, Art x Decentralised Tech, Art x Public AI and Art x
            Creative R&amp;D.
          </p>
          <p className="m-0 mt-5">
            Rooted in conversations with a diverse network of participants, the
            briefings have become widely shared resources that inform the
            practices and long-term strategies of artists, institutions and the
            wider cultural ecosystem, highlighting the importance of FAE itself
            as a project oriented around ecosystems. Today, FAE builds on the
            insights gained through the strategic briefings to host R&amp;D
            fellowships, develop partnerships and facilitate projects that are
            focused on the key priority areas for art x advanced technologies
            infrastructural development.
          </p>
          <p className="m-0 mt-5">
            Together with a wide range of collaborators, ranging from cultural
            institutions, artists, producers, curators, researchers and
            technologists, to businesses, policy makers and mission-oriented
            organisations, we’re committed to researching, prototyping and
            building twenty-first century cultural infrastructure in support of
            practices that emerge from the superimposition of art and advanced
            technologies.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col gap-3.5">
        <div className="flex w-full flex-col gap-2.5">
          <AboutSectionHeading title="Team" />
          <AboutSectionDivider />
        </div>
        <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            <p className="m-0 font-fira-mono text-xs leading-[14px] text-ink-primary">Current</p>
            <AboutTeamList members={CURRENT_TEAM} />
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="m-0 font-fira-mono text-xs leading-[14px] text-ink-primary">Past</p>
            <AboutTeamList members={PAST_TEAM} />
          </div>
        </div>
        <p className="m-0 font-suisseintl text-xs leading-[1.6] text-ink-primary">
          Future Art Ecosystems is initiated by and situated within the Arts
          Technologies department at Serpentine, London, UK.
        </p>
      </section>

      <section className="flex w-full flex-col gap-3.5">
        <div className="flex w-full flex-col gap-2.5">
          <AboutSectionHeading title="Links" />
          <AboutSectionDivider />
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Social and community links">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${link.label}`}
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
            >
              <Image
                src={link.imageSrc}
                alt={link.label}
                width={link.imageWidth}
                height={link.imageHeight}
                unoptimized
                className={`pointer-events-none w-auto shrink-0 object-contain ${link.imageClassName ?? "h-5"}`}
              />
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5">
          <p className="m-0 font-suisseintl text-xs leading-[1.6] text-ink-primary">To get more involved:</p>
          <div className="flex flex-col items-start gap-1.5">
            <AboutActionLink href="https://t.me/+RpackhOIPmQyODY0">
              Join our Telegram community
            </AboutActionLink>
            <button
              type="button"
              onClick={expandNewsletterSubscription}
              className="inline-flex items-center gap-2 rounded-[2px] border-0 bg-transparent p-0 font-fira-mono text-xs leading-[14px] text-ink-body underline decoration-solid underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-primary"
            >
              <span>Sign up to our monthly newsletter</span>
              <Image
                src="/svg/blue-arrow.svg"
                alt=""
                width={5}
                height={6}
                unoptimized
                className="pointer-events-none h-[6px] w-[5px] shrink-0"
                aria-hidden
              />
            </button>
            <AboutActionLink href="https://serpentinegalleries.ticketing.veevartapp.com/tickets/view/list/future-art-ecosystems-community-call-05032026">
              Take part in our quarterly Community Call
            </AboutActionLink>
          </div>
          <p className="m-0 font-suisseintl text-xs leading-[1.6] text-ink-primary">
            For partnerships and other inquiries, please email us.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col gap-2.5">
        <AboutSectionDivider />
        <p className="m-0 font-suisseintl text-xs leading-[1.6] text-ink-primary">Privacy Policy</p>
      </section>
    </div>
  );
}
