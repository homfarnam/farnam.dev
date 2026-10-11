/**
 * Single source of truth for personal facts.
 * Everything here is either supplied by Farnam or marked as a placeholder.
 * Never add metrics, dates or links that have not been confirmed.
 */

/** Marker for content that still has to be supplied. Rendered visibly as "pending". */
export const PLACEHOLDER = "__PLACEHOLDER__" as const;
export type MaybePlaceholder = string | typeof PLACEHOLDER;

export function isPlaceholder(value: MaybePlaceholder): value is typeof PLACEHOLDER {
  return value === PLACEHOLDER;
}

export interface ContactLink {
  id: "linkedin" | "github" | "email" | "resume";
  label: string;
  verb: string;
  href: MaybePlaceholder;
}

export interface Role {
  company: string;
  context?: string;
  title: string;
  period: string;
  location: string;
  current: boolean;
  summary: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
}

export const profile = {
  name: "Farnam",
  fullTitle: "Senior Fullstack JavaScript Developer",
  location: "Amsterdam, Netherlands",
  /** Professional development since 2015. */
  experienceYears: 10,
  title: "FARNAM: BEYOND THE CODE",
  tagline: "Every developer writes code. Every creation tells a story.",
  intro:
    "Senior fullstack JavaScript developer in Amsterdam. Ten years of shipping production frontends, from Tehran to Amsterdam — plus a few bots that quietly serve thousands of people.",
  interests: ["Creative engineering", "Software architecture", "Automation", "AI-assisted engineering"],
  /** Canonical site URL. */
  siteUrl: "https://farnam.dev",
} as const;

/** Career, newest first. Source: Farnam's CV (2026) plus Indeed profile for 2015. */
export const roles: Role[] = [
  {
    company: "Eltemate",
    context: "part of Hogan Lovells",
    title: "Fullstack JavaScript Developer",
    period: "May 2026 – now",
    location: "Amsterdam",
    current: true,
    summary: "Building fullstack JavaScript applications.",
  },
  {
    company: "4 Media Central",
    title: "Senior Full Stack Developer",
    period: "2025 – 2026",
    location: "Remote (Miami, US)",
    current: false,
    summary:
      "Owned features end to end: React/Next.js frontends, Node.js and GraphQL APIs on PostgreSQL, deployed to AWS. Raised test coverage from ~60% to ~85% and cut page load times by ~35%.",
  },
  {
    company: "Cliq Digital",
    title: "Senior Full Stack Developer",
    period: "Dec 2022 – Jan 2025",
    location: "Amsterdam",
    current: false,
    summary:
      "Built the B2C streaming platform's Storybook design system, led the headless CMS integration (Builder IO, Contentful), made page loads ~40% faster and met WCAG 2.2 AA.",
  },
  {
    company: "Open Social",
    title: "Frontend Engineer",
    period: "Mar 2022 – Aug 2022",
    location: "Amsterdam",
    current: false,
    summary: "Relocated from Tehran for this role. Built a social community platform with React, ReScript and GraphQL.",
  },
  {
    company: "Advanced ERP",
    title: "Frontend Developer",
    period: "Apr 2021 – Mar 2022",
    location: "Remote (Los Angeles, US)",
    current: false,
    summary: "Built ERP web apps: 15% higher client retention, 25% more engagement, 40% faster form and table development.",
  },
  {
    company: "Tuema Web and Mobile Development",
    title: "Frontend Developer",
    period: "Aug 2020 – Apr 2021",
    location: "Remote (Italy)",
    current: false,
    summary: "Next.js sites on a Strapi headless CMS; page loads 20% faster.",
  },
  {
    company: "Mel and Moj",
    title: "Frontend Developer",
    period: "Jul 2019 – May 2020",
    location: "Tehran",
    current: false,
    summary: "B2C e-commerce in React and TypeScript: pages 30% faster, conversion up 15%.",
  },
  {
    company: "Yazd Electrode",
    title: "Frontend Developer",
    period: "From Dec 2015",
    location: "Iran",
    current: false,
    summary: "First developer job.",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    label: "Frontend",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Remix",
      "Redux",
      "Zustand",
      "React Query",
      "Storybook",
      "Tailwind CSS",
      "Framer Motion",
    ],
  },
  { id: "backend", label: "Backend", items: ["Node.js", "Express.js", "NestJS", "Python", "GraphQL", "REST APIs"] },
  { id: "data", label: "Data", items: ["PostgreSQL", "Prisma ORM", "MongoDB"] },
  { id: "cms", label: "Headless CMS", items: ["Contentful", "Strapi", "Builder IO", "Sanity"] },
  {
    id: "architecture",
    label: "Architecture",
    items: ["Design systems", "Micro-frontends", "Monorepos (NX)", "SSR", "Performance", "Accessibility (WCAG 2.2)", "SEO"],
  },
  { id: "testing", label: "Testing", items: ["Playwright", "Cypress", "Jest", "React Testing Library", "Vitest"] },
  { id: "devops", label: "Cloud & DevOps", items: ["AWS (EC2, S3, Lambda, RDS)", "Docker", "GitHub Actions", "Vercel"] },
  { id: "ai", label: "AI", items: ["OpenAI API", "Anthropic API", "Claude Code", "Cursor", "GitHub Copilot"] },
];

export const spokenLanguages = ["Persian (native)", "English (fluent)", "Dutch (basic)"] as const;

export const music = {
  instruments: [
    { name: "Violin", note: "since 2014, at 17, in Tehran" },
    { name: "Electric guitar", note: "self-taught since 2023, in Amsterdam" },
    { name: "Accordion", note: "self-taught since 2025, in Amsterdam" },
  ],
  loves: ["Rock and metal", "Experimenting with guitar sounds", "Music production", "Creative technology"],
  games: "Games with strong narratives, exploration, atmosphere and interesting mechanics.",
} as const;

export const contactLinks: ContactLink[] = [
  { id: "linkedin", label: "LinkedIn", verb: "Connect on LinkedIn", href: "https://www.linkedin.com/in/farnam-homayounfard" },
  { id: "github", label: "GitHub", verb: "Explore GitHub", href: "https://github.com/homfarnam" },
  { id: "resume", label: "Resume", verb: "Download resume", href: PLACEHOLDER },
];
