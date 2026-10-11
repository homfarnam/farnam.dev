import { PLACEHOLDER, type MaybePlaceholder } from "./profile";

export type ProjectId = "streaming" | "telegram-audio" | "ind-monitor" | "pdf-bot" | "fullstack";

/** Which in-panel simulation a project ships with. */
export type SimulationKind = "streaming" | "telegram" | "radar" | "pdf" | "dashboard";

export interface Project {
  id: ProjectId;
  index: string;
  name: string;
  codename: string;
  oneLiner: string;
  problem: string;
  role: string;
  contributions: string[];
  tech: string[];
  /** Engineering challenges inherent to the problem domain. */
  challenges: string[];
  architecture: string[];
  /** Only verified outcomes. Empty array renders a "pending" note. */
  outcomes: string[];
  links: { github: MaybePlaceholder; live: MaybePlaceholder };
  simulation: SimulationKind;
  accent: string;
}

// Facts come from Farnam's CV. REVIEW(farnam): the IND monitor and PDF bot
// still describe what each problem demands rather than confirmed specifics.
export const projects: Project[] = [
  {
    id: "telegram-audio",
    index: "A-01",
    name: "Telegram Video-to-Audio Bot",
    codename: "The Messenger",
    oneLiner: "Send it a video, get the audio back. Used by more than 40,000 people.",
    problem: "People want the sound from a video — a talk, a song, a lecture — without installing an app or a converter.",
    role: "Designed, built and launched it end to end, from architecture to deployment.",
    contributions: [
      "Media-conversion pipelines for video and audio formats",
      "AI-assisted processing",
      "Subscriptions and one-time payments",
      "User management, subscription tracking and analytics",
    ],
    tech: ["Python", "Pyrogram", "MoviePy", "PostgreSQL", "Stripe", "Docker"],
    challenges: [
      "Converting media fast and reliably at scale for tens of thousands of users.",
      "Taking payments safely: secure Stripe webhook handling and fraud prevention.",
    ],
    architecture: [
      "Pyrogram client receives media from users in Telegram",
      "MoviePy pipelines convert video to audio, with AI-assisted processing",
      "Stripe handles subscriptions and one-time payments via secure webhooks",
      "PostgreSQL stores users, subscriptions and analytics",
    ],
    outcomes: ["40,000+ users"],
    links: { github: PLACEHOLDER, live: PLACEHOLDER },
    simulation: "telegram",
    accent: "#22D3EE",
  },
  {
    id: "streaming",
    index: "A-02",
    name: "Streaming Platform",
    codename: "The Theater",
    oneLiner: "Cliq Digital's B2C streaming platform: design system, headless CMS and performance.",
    problem:
      "Subscribers expect to browse a shifting catalogue and press play without friction, while marketing needs to ship new pages without waiting for developers.",
    role: "Senior Full Stack Developer at Cliq Digital (Dec 2022 – Jan 2025). Led end-to-end feature delivery and mentored junior developers.",
    contributions: [
      "Design system and reusable component library in Storybook, following Atomic Design",
      "Headless CMS integration with Builder IO and Contentful, so marketing could ship pages independently",
      "Node.js and GraphQL APIs for data-driven dashboards and analytics",
      "WCAG 2.2 AA accessibility across the interface",
      "CI/CD with Docker and AWS deployments",
    ],
    tech: [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Storybook",
      "Tailwind CSS",
      "React Query",
      "GraphQL",
      "Builder IO",
      "Contentful",
      "Playwright",
      "Docker",
      "AWS",
    ],
    challenges: [
      "Keeping one visual language consistent across an entire B2C platform.",
      "Decoupling content from code without slowing the site down.",
    ],
    architecture: [
      "Figma designs translated into a Storybook component library",
      "Content-driven pages assembled from Builder IO and Contentful",
      "Server rendering and code splitting for fast first paint",
      "Tested with Jest, Cypress and Playwright, deployed via Docker to AWS",
    ],
    outcomes: ["Page loads ~40% faster (SSR and code splitting)", "WCAG 2.2 AA compliance"],
    links: { github: PLACEHOLDER, live: PLACEHOLDER },
    simulation: "streaming",
    accent: "#3B82F6",
  },
  {
    id: "ind-monitor",
    index: "A-03",
    name: "IND Appointment Monitor",
    codename: "The Watchtower",
    oneLiner: "Watches Dutch immigration appointment availability so people don't have to refresh all day.",
    problem:
      "Appointment slots at the IND (the Dutch immigration service) are scarce and appear unpredictably. Checking manually is exhausting.",
    role: "Built the monitor.",
    contributions: ["Availability monitoring", "Notification delivery when slots open up"],
    tech: ["Automation", "Notifications"],
    challenges: [
      "Polling often enough to catch short-lived slots while staying respectful of the source.",
      "Notifying quickly and only when something actually changed.",
    ],
    architecture: ["Scheduled availability checks", "Change detection between checks", "Notification on new availability"],
    outcomes: [],
    links: { github: PLACEHOLDER, live: PLACEHOLDER },
    simulation: "radar",
    accent: "#F97316",
  },
  {
    id: "pdf-bot",
    index: "A-04",
    name: "PDF-to-Image Bot",
    codename: "The Archive",
    oneLiner: "A Telegram bot that turns PDF documents into images.",
    problem: "Sharing one page of a PDF as an image shouldn't require desktop software.",
    role: "Built the bot.",
    contributions: ["Telegram bot interface", "PDF page rendering to images"],
    tech: ["Python", "Telegram API"],
    challenges: ["Rendering multi-page documents into ordered images.", "Returning results quickly inside a chat."],
    architecture: ["User uploads a PDF in chat", "Each page is rendered to an image", "Images are returned to the chat in order"],
    outcomes: [],
    links: { github: PLACEHOLDER, live: PLACEHOLDER },
    simulation: "pdf",
    accent: "#94A3B8",
  },
  {
    id: "fullstack",
    index: "A-05",
    name: "Fullstack Applications",
    codename: "The Control Room",
    oneLiner: "Dashboards, ERP tools and product platforms, owned end to end.",
    problem:
      "Teams need tools that make complex data and workflows understandable — and that stay fast and reliable as they grow.",
    role: "Senior Full Stack Developer at 4 Media Central (2025 – 2026); earlier, Frontend Developer at Advanced ERP.",
    contributions: [
      "React and Next.js frontends with Node.js/Express REST and GraphQL APIs",
      "PostgreSQL with Prisma ORM, deployed to AWS (EC2, S3, Lambda)",
      "Storybook design system translated from Figma",
      "AI-powered features using LLM APIs",
      "Automated testing strategy and CI/CD with GitHub Actions",
    ],
    tech: [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Express.js",
      "GraphQL",
      "PostgreSQL",
      "Prisma",
      "Storybook",
      "Playwright",
      "GitHub Actions",
      "AWS",
    ],
    challenges: ["Raising quality without slowing delivery.", "Keeping large applications fast as they grow."],
    architecture: [
      "Next.js frontend on a typed GraphQL / REST layer",
      "Node.js services on PostgreSQL via Prisma",
      "CI/CD pipelines with GitHub Actions to AWS",
    ],
    outcomes: [
      "Test coverage ~60% → ~85% (4 Media Central)",
      "Page loads ~35% faster (4 Media Central)",
      "Client retention +15%, engagement +25% (Advanced ERP)",
    ],
    links: { github: PLACEHOLDER, live: PLACEHOLDER },
    simulation: "dashboard",
    accent: "#3B82F6",
  },
];

export function getProject(id: ProjectId): Project {
  const project = projects.find((candidate) => candidate.id === id);
  if (!project) throw new Error(`Unknown project: ${id}`);
  return project;
}
