/**
 * The route from Tehran to Amsterdam. Every stop is a confirmed fact from
 * Farnam (CV + conversation). Some details are left out at Farnam's request.
 */

export type StopKind = "music" | "work" | "move";
export type Region = "tehran" | "flight" | "amsterdam";

export interface RemoteLink {
  label: string;
  lon: number;
  lat: number;
}

export interface JourneyStop {
  id: string;
  /** Shown big on the beacon and in the timeline. */
  year: string;
  when: string;
  place: string;
  title: string;
  /** One or two short lines. */
  body: string;
  kind: StopKind;
  region: Region;
  /** Remote roles draw a link from the city towards where the team was. */
  remote?: RemoteLink;
}

export const journeyStops: JourneyStop[] = [
  {
    id: "violin",
    year: "2014",
    when: "2014",
    place: "Tehran",
    title: "The violin",
    body: "At 17, I picked up the violin. My first instrument, a year before my first line of production code.",
    kind: "music",
    region: "tehran",
  },
  {
    id: "first-job",
    year: "2015",
    when: "December 2015",
    place: "Iran",
    title: "First line of production code",
    body: "Frontend Developer at Yazd Electrode. Where code stopped being a hobby.",
    kind: "work",
    region: "tehran",
  },
  {
    id: "mel-and-moj",
    year: "2019",
    when: "July 2019",
    place: "Tehran",
    title: "Mel and Moj",
    body: "B2C e-commerce in React and TypeScript. Pages 30% faster, conversion up 15%.",
    kind: "work",
    region: "tehran",
  },
  {
    id: "tuema",
    year: "2020",
    when: "August 2020",
    place: "Tehran → Italy, remote",
    title: "Tuema",
    body: "First remote team abroad. Next.js on a Strapi headless CMS, pages 20% faster.",
    kind: "work",
    region: "tehran",
    remote: { label: "Italy", lon: 12.6, lat: 42.8 },
  },
  {
    id: "advanced-erp",
    year: "2021",
    when: "April 2021",
    place: "Tehran → Los Angeles, remote",
    title: "Advanced ERP",
    body: "ERP web apps for a US company: client retention +15%, engagement +25%.",
    kind: "work",
    region: "tehran",
    remote: { label: "Los Angeles", lon: -118.24, lat: 34.05 },
  },
  {
    id: "the-move",
    year: "2022",
    when: "March 2022",
    place: "Tehran → Amsterdam",
    title: "The move",
    body: "A job offer from Open Social, and a one-way flight. New country, new language, same keyboard.",
    kind: "move",
    region: "flight",
  },
  {
    id: "open-social",
    year: "2022",
    when: "March 2022",
    place: "Amsterdam",
    title: "Open Social",
    body: "Frontend Engineer on a social community platform, built with React, ReScript and GraphQL.",
    kind: "work",
    region: "amsterdam",
  },
  {
    id: "cliq",
    year: "2022",
    when: "December 2022",
    place: "Amsterdam",
    title: "Cliq Digital",
    body: "Senior Full Stack on a B2C streaming platform: a Storybook design system, headless CMS, pages ~40% faster.",
    kind: "work",
    region: "amsterdam",
  },
  {
    id: "guitar",
    year: "2023",
    when: "2023",
    place: "Amsterdam",
    title: "Electric guitar",
    body: "Self-taught. Rock, metal, and a lot of experimenting with sound.",
    kind: "music",
    region: "amsterdam",
  },
  {
    id: "4mc",
    year: "2025",
    when: "January 2025",
    place: "Amsterdam → Miami, remote",
    title: "4 Media Central",
    body: "Senior Full Stack, end to end: test coverage ~60% → ~85%, pages ~35% faster.",
    kind: "work",
    region: "amsterdam",
    remote: { label: "Miami", lon: -80.19, lat: 25.76 },
  },
  {
    id: "accordion",
    year: "2025",
    when: "2025",
    place: "Amsterdam",
    title: "Accordion",
    body: "Self-taught again. A third instrument, a new kind of patience.",
    kind: "music",
    region: "amsterdam",
  },
  {
    id: "eltemate",
    year: "2026",
    when: "May 2026",
    place: "Amsterdam",
    title: "Eltemate",
    body: "Fullstack JavaScript Developer at Eltemate, part of Hogan Lovells. Where the route reaches today.",
    kind: "work",
    region: "amsterdam",
  },
];

export const journeyKindColor: Record<StopKind, string> = {
  music: "#F97316",
  work: "#22D3EE",
  move: "#F8FAFC",
};
