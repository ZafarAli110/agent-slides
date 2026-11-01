// The shapes of a deck. Import them in slides.ts so a wrong layout or a missing field is a type error, not a broken
// slide on the projector.

export interface Part {
  id: string;
  title: string;
  /** The footer on this part's slides. Defaults to the deck's footer. */
  footer?: string;
}

export interface Deck {
  title: string;
  /** The brand mark in each slide's corner: the first word is bold, the rest italic. Defaults to the title. */
  brand?: string;
  /** The footer on every slide unless a part or a slide sets its own. */
  footer?: string;
  /** Sections of the talk; each gets a button in the bar at the bottom. */
  parts?: Part[];
  /** The id of the slide the O key and the Overview button go to. Defaults to the first slide. */
  overview?: string;
  /** Overrides the theme's CSS variables, e.g. { cyan: "#5EC2D0", coral: "#E8875A" } (see src/theme.css). */
  theme?: Record<string, string>;
  /** A Google Fonts stylesheet URL; the only external link the deck makes. */
  fonts?: string;
  /** The label before each takeaway. Defaults to "Why it matters". */
  takeawayLabel?: string;
  /** Where images for screenshot slides live, relative to the slides file. Defaults to "assets". */
  assets?: string;
  lang?: string;
}

/** An inline string: **bold** and `code` are the only markup. */
type Text = string;

interface Base {
  /** Unique, kebab-case: it is the slide's address (#id) and its screenshot's file name. */
  id: string;
  part?: string;
  /** The small label above the title, naming where the slide sits in the talk. */
  eyebrow?: Text;
  /** Spoken by the presenter, shown with N. Delivery guidance, not a summary of the slide. */
  notes?: string;
  /** Overrides the counter at the top right, e.g. "Live demo". */
  partLabel?: Text;
  footer?: Text;
  /** Show the slide's points, list items, steps or rows one per key press. */
  reveal?: boolean;
}

export interface Point {
  label: Text;
  text: Text;
  example?: Text;
  /** A small label above the point, e.g. "1 · weakest". */
  meta?: Text;
}

export type ListItem = Text | { text: Text; example: Text };

export type Slide = Base & (
  | { layout: "cover"; title: Text; subtitle: Text; kicker?: Text; motto?: string }
  | { layout: "section"; title: Text; subtitle: Text }
  | { layout: "big"; title: Text; subtitle?: Text; accent?: Text }
  | { layout: "explain"; title: Text; definition?: Text; points?: Point[]; takeaway?: Text; note?: Text }
  | { layout: "compare"; title: Text; definition?: Text; leftTitle: Text; left: ListItem[]; rightTitle: Text; right: ListItem[]; takeaway?: Text; note?: Text }
  | { layout: "sequence"; title: Text; definition?: Text; steps: ({ label: Text; text?: Text; example?: Text } | Text)[]; groups?: { label: Text; span: number }[]; takeaway?: Text; note?: Text }
  | { layout: "table"; title: Text; definition?: Text; columns: Text[]; rows: Text[][]; bigTable?: boolean; takeaway?: Text; note?: Text }
  | { layout: "code"; title: Text; code: string[]; lang?: "shell"; diff?: boolean; bigCode?: boolean; window?: string; callout?: Text }
  | { layout: "demo"; title: Text; subtitle?: Text; steps?: { label: Text; text: Text }[]; rule?: Text }
  | { layout: "screenshots"; title: Text; shots: { image: string; alt: string; caption: Text; weight?: number }[]; takeaway?: Text }
  | { layout: "quote"; title: Text; quote: Text }
  | { layout: "checklist"; title: Text; items: Text[]; takeaway?: Text }
  | { layout: "exercise"; title: Text; prompt: Text; items: ListItem[] }
);

export type Layout = Slide["layout"];
