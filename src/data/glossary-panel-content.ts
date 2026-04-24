/**
 * Glossary copy for `GlossaryPanel`.
 */

export type GlossaryPanelEntry = {
  id: string;
  term: string;
  definition: string;
};

export const GLOSSARY_PANEL_ENTRIES: GlossaryPanelEntry[] = [
  {
    id: "advanced-technologies",
    term: "Advanced technologies",
    definition:
      "Emerging technical domains—including machine learning, sensing, and distributed systems—that reshape how art is produced, distributed, and experienced.",
  },
  {
    id: "briefing",
    term: "Briefing",
    definition:
      "A focused publication or session that frames a question, gathers evidence, and proposes directions for the field.",
  },
  {
    id: "latest-updates",
    term: "Latest updates",
    definition:
      "The docked strip that surfaces new work, releases, and program highlights so you can scan what’s new without leaving the index.",
  },
  {
    id: "rd-lab",
    term: "R&D Lab",
    definition:
      "Hands-on research settings where artists, technologists, and partners prototype ideas and share methods.",
  },
];
