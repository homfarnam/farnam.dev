# Content checklist for Farnam

Everything on the site comes from what you supplied. These items are missing, or were written from the problem domain and need you to confirm them.

## Must supply (shown publicly as "pending" until then)

- [x] LinkedIn and GitHub, taken from the CV (email and phone are left off on purpose)
- [ ] Resume PDF: put it in `public/` and set `href: "/resume.pdf"`
- [x] Real domain: `profile.siteUrl` is https://farnam.dev (used for canonical, OG, sitemap, robots)
- [ ] Per-project GitHub / live links — `src/data/projects.ts` → `links`

## Please confirm or rewrite

- [ ] Summary of your Eltemate role (currently "Building fullstack JavaScript applications.")
- [ ] 4 Media Central is shown as 2025 – 2026 on the Journey and in the text version. Remove it if you'd rather not show it.
- [ ] `challenges` and `architecture` for the IND monitor and PDF bot. These are still written from what each problem demands. The other three projects now use the facts from your CV.
- [ ] Tech for the IND monitor (currently "Automation, Notifications") and the PDF bot (currently "Python, Telegram API": confirm it, and say whether it used Pyrogram like the audio bot)
- [ ] Your role on each bot (currently "Built the bot / monitor"). Say "sole developer" if that's true.
- [ ] Any measurable outcomes beyond "40,000+ users" (none are shown until you confirm them)

## Creative copy (intentionally fictional, labelled as such)

- Journey lines that add flavour beyond the CV facts (`src/data/journey.ts`). Approve or edit them:
  - "Where code stopped being a hobby." (2015)
  - "First remote team abroad." (Tuema, 2020)
  - "New country, new language, same keyboard." (the move)
  - "A third instrument, a new kind of patience." (accordion)

- The first screen's headline, "10+ years of code. Tehran → Amsterdam.", and its facts row (Based in · From · Role · Stack · Music) in `src/components/ui/BootSequence.tsx`. Built from confirmed facts; check the wording and the four stack items you want to lead with.
- The violin narrative line ("Before I started building digital experiences, music taught me…") is website copy from the brief, not an autobiographical claim. Keep it, edit it or replace it.
- Every simulation uses sample data and says so on screen ("simulation", "fictional titles", "sample data").
