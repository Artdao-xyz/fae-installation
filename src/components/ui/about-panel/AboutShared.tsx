"use client";

import type { ReactNode } from "react";
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
      {"\n\n"}
      Through creative research and development, including fellowships,
      prototypes, briefings, labs, gatherings and a community of artists,
      technologists, researchers and peer organisations, Future Art Ecosystems
      develops insights, tools and artistic commissions that advance this vision.
      Embedded within Serpentine’s Arts Technologies team, Future Art Ecosystems
      excavates new spaces for art, technology and society to flourish,
      delivering on plural forms of public value.
    </p>
  </>
);

const KEY_AREAS = [
  {
    title: "Advanced Production Capabilities",
    body: "We advocate for independent, in-house and production models to advance the development of AxAT practices.",
  },
  {
    title: "Protocols for Organisational Interoperability",
    body: "We devise new benchmarks and systems for substantial, enduring collaborations between organisations across a plurality of cultural, technological and civic ecosystems.",
  },
  {
    title: "New Ownership & Distribution Models:",
    body: "We prototype new models for generative and equitable value distribution in support of producers and their communities.",
  },
  {
    title: "New Metrics of Value & Success",
    body: "We develop new measurement systems for evaluating the public value of AxAT, moving beyond footfall and media visibility as the dominant metrics of success.",
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

      <AboutContentPiece title="About">
        <p className="m-0">
          Future Art Ecosystems is an initiative for building twenty-first
          century cultural infrastructure in support of practices that emerge
          from the superimposition of art and advanced technologies.
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
          , sign up to our monthly newsletter and take part in our quarterly{" "}
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
