import {
  ACTIVITY_TYPE_LABELS,
  FOCUS_AREA_LABELS,
} from "@/components/ui/filter-menu/config/constants";

export type ContentFixtureRow = {
  id: string;
  title: string;
  imageUrl: string;
  /** Long-form body copy (uses *…* for emphasis where noted). */
  content: string;
  /** 1–3 outbound resource URLs per row. */
  resources: readonly string[];
  /** 1–3 labels from {@link FOCUS_AREA_LABELS}; every focus label appears at least once across the fixture. */
  focusAreas: readonly string[];
  /** 1–3 labels from {@link ACTIVITY_TYPE_LABELS}; every activity type appears at least once across the fixture. */
  activityTypes: readonly string[];
};

/** Deterministic mix for tag picking (stable across runs). */
function mix(i: number, s: number): number {
  let h = Math.imul(i + 1, 374761393) + Math.imul(s, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return h >>> 0;
}

function tagCount1to3(index: number, salt: number): number {
  return 1 + (mix(index, salt) % 3);
}

function pickDistinctFromPool(
  index: number,
  pool: readonly string[],
  targetCount: number,
  mustInclude: string | undefined,
  saltBase: number,
): string[] {
  const cap = Math.min(targetCount, pool.length);
  const set = new Set<string>();
  if (mustInclude) set.add(mustInclude);
  let attempts = 0;
  while (set.size < cap && attempts < pool.length * 8) {
    const idx = mix(index, saltBase + attempts) % pool.length;
    set.add(pool[idx]!);
    attempts++;
  }
  return Array.from(set);
}

/** Plausible outbound links; 1–3 are picked per row (deterministic). */
const RESOURCE_LINK_POOL = [
  "https://futureartecosystems.com/",
  "https://www.radicalxchange.org/",
  "https://aerocene.org/",
  "https://www.tate.org.uk/",
  "https://www.e-flux.com/",
  "https://www.creativecommons.org/",
  "https://github.com/artdao",
  "https://www.ethereum.org/",
  "https://ipfs.tech/",
  "https://www.w3.org/TR/did-core/",
  "https://www.zora.co/",
  "https://mirror.xyz/",
  "https://www.figma.com/",
  "https://developer.mozilla.org/",
  "https://www.are.na/",
  "https://www.newmuseum.org/",
  "https://www.serpentinegalleries.org/",
  "https://www.london.gov.uk/",
  "https://www.arts.gov/",
  "https://www.unesco.org/",
] as const;

function pickResourcesForIndex(index: number): string[] {
  const n = 1 + (mix(index, 1601) % 3);
  const out: string[] = [];
  let attempts = 0;
  while (out.length < n && attempts < RESOURCE_LINK_POOL.length * 2) {
    const u =
      RESOURCE_LINK_POOL[mix(index, 1703 + attempts) % RESOURCE_LINK_POOL.length]!;
    if (!out.includes(u)) out.push(u);
    attempts++;
  }
  return out;
}

/**
 * Paragraphs composed into per-row long `content` (deterministic picks).
 * Use `{{title}}` where the row title should appear.
 */
const CONTENT_BLOCKS: readonly string[] = [
  `Art enriches society through the weaving of relations between the cultures that create it and the cultures that receive it. *PCO* is a new system that allows artists, communities and holders of art to create structures of shared ownership and value distribution that better reflect those living relationships.

Since November 2022, FAE has shifted towards designing and testing protocols. Partial common ownership (PCO) of art is one such tool. This summer, artists looking to experiment with partial common ownership licences for their work can use an open-source implementation developed in partnership with RadicalxChange and the Aerocene Foundation.

This system builds on the research and findings of *FAE3: Art x Decentralised Tech* (2022) and *Beyond Cultures of Ownership* (2023-24), which explore the possibilities of developing new ownership and distribution models by leveraging blockchain technologies and positioning the cultural domain as a critical site for experimentation with such models.`,

  `“{{title}}” sits at the intersection of cultural infrastructure and experimental practice. The programme asks how stewardship, tooling, and governance can be redesigned so that value accrues to the communities who sustain artistic work over time, not only at the moment of transaction.

Workshops and field tests gather artists, technologists, and institutional partners to prototype protocols together. Documentation is published openly so others can adapt, fork, or critique the same materials in new contexts.`,

  `Infrastructure is never neutral: it encodes priorities about who can participate, who is legible, and who bears risk. The research strand behind *{{title}}* treats those questions as design problems—measured through prototypes, user research, and long-form writing that connects art-world specifics to wider civic debates.

Partnerships extend across museums, independent studios, and public agencies. The aim is not to prescribe a single stack, but to articulate interoperable patterns that many kinds of organisation can adopt.`,

  `Distribution and discovery remain unsolved at the scale of global networked culture. *{{title}}* contributes case studies where labels, rights metadata, and community governance are treated as part of the same surface—so that audiences, collectors, and collaborators can reason about provenance and intent without specialised tooling.

Follow-up phases stress education: short briefings for policymakers, annotated diagrams for legal teams, and working code for engineers who want to integrate the same ideas into their own products.`,

  `The work acknowledges friction: ethical alignment is slow, consensus is messy, and technical standards move faster than social norms. Rather than smoothing those tensions away, the narrative documents them—minutes from working groups, dissenting opinions, and revised drafts when assumptions fail in the field.

Readers are invited to treat *{{title}}* as a living appendix: citations point to primary sources, and each release notes what changed since the last revision and why.`,

  `Climate, migration, and labour conditions shape how art is made and circulated. This thread connects *{{title}}* to artists who treat logistics, energy use, and care work as explicit materials in the work—not background conditions to optimise away.

Case files combine interviews, emissions estimates where available, and speculative scenarios that ask what “sustainable” practice could mean when institutions and markets move at different speeds.`,

  `Education is treated as infrastructure: syllabi, reading lists, and hands-on exercises are published under permissive licences so schools and collectives can remix them. *{{title}}* includes facilitator notes where exercises failed or produced unexpected outcomes—often the most instructive material.

The goal is to lower the cost of trying ambitious ideas in small groups without pretending every pilot will scale cleanly.`,

  `Legal and policy horizons matter as much as code. Notes summarise consultations with counsel about licensing, liability, and cross-border transfers, written for non-specialists who still need enough detail to make informed decisions about participation.

Nothing here is legal advice; it is a map of questions teams asked, answers they received, and open issues that remain unresolved across jurisdictions.`,

  `Aesthetics and interface design receive equal weight: public-facing sites, exhibition graphics, and PDFs are critiqued for clarity, accessibility, and tone. *{{title}}* argues that the “wrapper” around a protocol shapes who feels welcome to engage with it.

Design research includes moderated sessions with visitors who are new to the topic, to catch jargon and intimidation early.`,

  `Archives and long-term preservation are part of the mandate. Snapshots of websites, repositories, and correspondence are described with checksums and storage locations so future researchers can verify what was said when.

*{{title}}* ties those practices to artistic traditions that already think in generations rather than quarters.`,
];

function buildContentForIndex(index: number, title: string): string {
  const blockCount = 2 + (mix(index, 1807) % 2);
  const parts: string[] = [];
  for (let b = 0; b < blockCount; b++) {
    const bi = mix(index, 1909 + b * 31) % CONTENT_BLOCKS.length;
    parts.push(CONTENT_BLOCKS[bi]!.replace(/\{\{title\}\}/g, title));
  }
  return parts.join("\n\n");
}

const CONTENT_FIXTURE_TITLES = [
  "FAE1: Art x Advanced Tech",
  "Art x Advanced Technologies",
  "Dynamic Materials",
  "Developing Networks",
  "Constructing Narratives",
  "Success In Adjacent Fields",
  "Artworld as Medium",
  "AxAT Infrastructure",
  "The Art Industry",
  "Space & Time",
  "Skills & Equipment",
  "Products & Services",
  "Art-Industrial Revolution",
  "Tech Industry as Art Patron",
  "Art Stacks",
  "21C Cultural Infrastructure",
  "Ben Vickers & HUO",
  "Creative AI Lab Introduction",
  "Emergence of Creative AI",
  "Creative AI Lab",
  "Aesthetics of AI",
  "Aesthetics of AI Interfaces",
  "Aesthetics of AI Entanglements",
  "Tactical Engagements",
  "Godmode Epochs",
  "FAE2: Live",
  "FAE2: Art x Metaverse",
  "UX of Art",
  "White Cube vs VR",
  "Hybrid Reality Strategies",
  "Art Adjacency",
  "Game Technologies",
  "Art Adjacent Experimentation",
  "Indie Games",
  "Gaming & Blockchain",
  "Film Festivals",
  "Architecture",
  "Culture Infrastructure Vectors",
  "Building for Interoperability",
  "Advanced Production Investment",
  "Expanded Economic Rationales",
  "Users-as-Stakeholders",
  "New Systems of Measurement",
  "Trust Plays Hivemind",
  "Y.P.A.C.H.O.B.",
  "Libby Heaney Plays Hivemind",
  "Legal Lab: Creative Agency",
  "Legal Lab: ART NFTs",
  "Legal Lab: About",
  "Legal Lab: Web3 Licensing",
  "Legal Lab: NFTs and the Law",
  "Legal Lab: Tech Report",
  "Gabriel Massan: Third World",
  "Keiken: Morphogenic Angels",
  "Black Beyond: Warpmode",
  "FAE3 Launch",
  "FAE3: Decentralised Art Tech",
  "Infrastructure Patterns",
  "Retooling Artist Authenticity",
  "Networked Provenance",
  "Artist-as-Platform",
  "Full Stack Blockchain Art",
  "Spontaeneous Innovation",
  "Tools Performing Culture",
  "Everything Is An Asset",
  "Governance Design",
  "New Systems Ontologies",
  "Memory Infrastructure Networks",
  "Entities Vs. Identities",
  "Community-as-Aura",
  "Permissionless Worlds",
  "From Limits to Possibilities",
  "Creative R&D",
  "Delivery of Public Value",
  "Durable Structures",
  "Pathways to Interoperability",
  "Continual Service Architecture",
  "Distributed Ownership",
  "Modular AxAT Practices",
  "Synthetic Ecologies Live",
  "FAE4 Launch",
  "FAE4: Art x Public AI",
  "Defining Public AI",
  "AI Tech Stack",
  "Software: Application Layer",
  "Software: Network Protocols",
  "Software: Model Layer",
  "Software: Data Layer",
  "Hardware: Compute Layer",
  "Hardware: Server Networks",
  "Hardware: Natural Resources",
  "AI Organisation",
  "Dormant Data Keepers",
  "Organisational Self-Knowledge",
  "Latent Data Troves",
  "Relational Data",
  "Trusted Data Stewards",
  "Sovereign AI",
  "Soft Power Diplomacy",
  "Culture-Model Ouroboros",
  "Technical Opacity",
  "Trust and Verifiability",
  "Model-as-Compression",
  "New Public Mission Mechanisms",
  "Alignment's Shadow Negotations",
  "Seeing in Latent Space",
  "Minotaur Vs. Centaur",
  "Barriers to Cultural Entry",
  "Supply Chain Geopolitics",
  "IP Empire",
  "State as Compute Broker",
  "Decentralised Computation",
  "AI Artists",
  "Training Data as Shadow Labour",
  "Leverage IP for Opt In Returns",
  "Leverage for Opt Out Power",
  "Data Brokerage",
  "Accountability Mechanisms",
  "Synthetic Crafting",
  "Unchartered Territory",
  "Deskilling to Reskilling",
  "The End of Prompt-Engineering",
  "Semi-Autonomous Aesthetics",
  "Convergence Engines",
  "Style Capture",
  "Recombinant Aesthetics",
  "Cross-Pollinating Systems",
  "AI Tool Deployment Modalities",
  "Model-Making as Meaning-Making",
  "Systems Builders",
  "Systems to Worlds",
  "New Era (Art) Tech Development",
  "AI Ecosystems",
  "Adv. Production Capabilities",
  "Interoperability Protocols",
  "New Ownership Models",
  "New Systems of Measurement",
  "AI Participation Strategies",
  "Organisational Practice Tests",
  "New IP Paradigms",
  "Cross-Technological Use-Cases",
  "Lobbying for Improved Access",
  "Trusted Data Intermediary",
  "Choral Data ‘Trust’ Experiment",
  "UK Choral AI Dataset",
  "Building Data Infrastructure",
  "FAE5: Art x Creative R&D",
  "Introduction to Creative R&D",
  "AxAT Lens on Creative R&D",
  "The Metrics Gap",
  "Defining Creative R&D",
  "Creative R&D & Industry",
  "Recalibrating Creative R&D",
  "AxAT Artists",
  "Defining AxAT Artists",
  "In Focus: Lauren Lee McCarthy",
  "In Focus: Ian Cheng",
  "In Focus: Natsai Audrey Chieza",
  "Art's Role in Innovation",
  "Artists as Cross-Pollinators",
  "Barriers to Impact",
  "Creative R&D Infrastructure",
  "Propagating Creative R&D",
  "Culture Organisation Spin-Outs",
  "Dedicated AxAT Entities",
  "Self-Organised AxAT Intiatives",
  "Cross-Sector Relationships",
  "Cross-Sector Currents",
  "Cultural-Civic Partnerships",
  "Fairclouds",
  "RadicalxChange",
  "Rethinking Art Ownership",
  "Beyond Cultures of Ownership",
  "Partial Common Ownership",
  "BCO London 2023",
  "BCO London 2023 Keynotes",
  "Tech-Industry Partnerships",
  "Beyond Marketing Logic",
  "Academic Coalitions",
  "Research Platform Exhibitions",
  "Educational Collaborations",
  "Shared Tech Infrastructure",
  "Bilateral Research Partnership",
  "Policy-Driven UK Creative R&D",
  "Creative R&D Proposals",
  "Establish Creative AI Entity",
  "Broaden DSIT R&D Definition",
  "Ecosystem Measurement Models",
  "Full Spectrum Creative R&D",
  "Imagining FAE",
  "Cecile B Evans Agnes",
  "James Bridle Cloud Index",
  "Ian Cheng - Bob",
  "Hito Steyerl - Actual Reality OS",
  "DMSTFCTN dmstfctn ft. Evita Manji: Waluigi’s Purgatory",
  "We Can’t Do This Alone Danielle Brathwaite Shirley",
  "Maggie Roberts - A Cephalopod Machine Encounter",
  "DAOWO",
  "Artists Re:Thinking The Blockchain",
  "New World Order",
  "Ethereal Summit Blockchain Lab",
  "Artworld DAO",
  "Blockchain & Art Knowledge Sharing Summit UK",
  "DECAL",
  "CultureStake",
  "A Blockchain Art History Timeline",
  "DAOWO Summits UK 2020",
  "DAOWO Global Initiative 2021",
  "The DAOWO Sessions: Artworld Prototypes 2022",
  "Blockchain Lab: Radical Friends Book Launch",
  "Radical Friends",
  "Beyond Cultures of Ownership: Emerging Strategies for Interdependence",
  "Fairclouds",
  "Artist Worlds",
  "Jakob Kudsk Steensen",
] as const;

export const CONTENT_FIXTURE_ROWS: ContentFixtureRow[] = CONTENT_FIXTURE_TITLES.map(
  (title, index) => {
    const numericId = index + 1;
    const paddedId = String(numericId).padStart(3, "0");

    const focusMust =
      index < FOCUS_AREA_LABELS.length ? FOCUS_AREA_LABELS[index] : undefined;
    const activityMust =
      index < ACTIVITY_TYPE_LABELS.length ? ACTIVITY_TYPE_LABELS[index] : undefined;

    const focusAreas = pickDistinctFromPool(
      index,
      FOCUS_AREA_LABELS,
      tagCount1to3(index, 401),
      focusMust,
      701,
    );
    const activityTypes = pickDistinctFromPool(
      index,
      ACTIVITY_TYPE_LABELS,
      tagCount1to3(index, 503),
      activityMust,
      907,
    );

    return {
      id: `content-${paddedId}`,
      title,
      imageUrl: `https://picsum.photos/seed/content-${paddedId}/220/220.webp`,
      content: buildContentForIndex(index, title),
      resources: pickResourcesForIndex(index),
      focusAreas,
      activityTypes,
    };
  }
);

if (process.env.NODE_ENV === "development") {
  console.log("[content-fixture] sample row", CONTENT_FIXTURE_ROWS[0]);
}
