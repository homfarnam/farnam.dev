import { chapters } from "@/data/chapters";
import { journeyStops } from "@/data/journey";
import { CITY_KM, FLIGHT_KM, formatKm } from "@/lib/world/globe";
import { contactLinks, music, profile, roles, skillGroups, spokenLanguages } from "@/data/profile";
import { projects } from "@/data/projects";
import { ContactLinkItem } from "@/components/ui/ContactLinkItem";

/**
 * Server-rendered, crawlable version of the whole story.
 * It is the SEO surface, the no-WebGL fallback and the "text version" view.
 */
export function StoryDocument() {
  return (
    <main id="content" className="relative mx-auto max-w-3xl px-5 pb-32 pt-24 sm:px-8">
      <header className="mb-24">
        <p className="font-mono text-sm text-cyan">{profile.location}</p>
        <h1 className="mt-4 text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">{profile.name}</h1>
        <p className="mt-3 text-xl text-mute sm:text-2xl">{profile.fullTitle}</p>
        <p className="mt-10 max-w-[60ch] text-lg leading-relaxed text-ink/90">{profile.intro}</p>
        <p className="mt-6 text-mute italic">{profile.tagline}</p>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {contactLinks.map((link) => (
            <li key={link.id}>
              <ContactLinkItem link={link} className="underline decoration-cyan/50 underline-offset-4 hover:decoration-cyan" />
            </li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="journey-heading" className="mb-24">
        <ChapterHeading id="journey-heading" chapterId="journey" />
        <p className="mt-6 text-ink/85">
          Tehran to Amsterdam, one way, March 2022: {formatKm(FLIGHT_KM)} km great-circle distance from Imam Khomeini (IKA) to
          Schiphol (AMS), {formatKm(CITY_KM)} km city centre to city centre.
        </p>
        <ol className="mt-8 space-y-5">
          {journeyStops.map((stop) => (
            <li key={stop.id} className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <p className="font-mono text-sm text-mute">{stop.when}</p>
              <div>
                <p className="text-lg">
                  {stop.title} <span className="text-sm text-mute">· {stop.place}</span>
                </p>
                <p className="mt-1 text-ink/85">{stop.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="engineer-heading" className="mb-24">
        <ChapterHeading id="engineer-heading" chapterId="engineer" />
        <ol className="mt-8 space-y-6">
          {roles.map((role) => (
            <li key={role.company} className="border-l border-line pl-5">
              <p className="text-lg">
                {role.title} · <span className="text-cyan">{role.company}</span>
                {role.context ? <span className="text-mute"> ({role.context})</span> : null}
              </p>
              <p className="mt-1 text-sm text-mute">
                {role.period} · {role.location}
              </p>
              <p className="mt-2 text-ink/85">{role.summary}</p>
            </li>
          ))}
        </ol>
        <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.id}>
              <dt className="font-mono text-sm text-cyan">{group.label}</dt>
              <dd className="mt-2 text-ink/85">{group.items.join(", ")}</dd>
            </div>
          ))}
          <div>
            <dt className="font-mono text-sm text-cyan">Languages</dt>
            <dd className="mt-2 text-ink/85">{spokenLanguages.join(", ")}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="creator-heading" className="mb-24">
        <ChapterHeading id="creator-heading" chapterId="creator" />
        <div className="mt-10 space-y-16">
          {projects.map((project) => (
            <article key={project.id} aria-labelledby={`project-${project.id}`}>
              <h3 id={`project-${project.id}`} className="text-2xl font-medium">
                {project.name}
              </h3>
              <p className="mt-2 text-mute">{project.oneLiner}</p>
              <dl className="mt-6 space-y-4 text-ink/85">
                <DetailRow term="Problem">{project.problem}</DetailRow>
                <DetailRow term="Role">{project.role}</DetailRow>
                <DetailRow term="Contributions">{project.contributions.join("; ")}.</DetailRow>
                <DetailRow term="Technology">{project.tech.length ? project.tech.join(", ") : "To be added."}</DetailRow>
                <DetailRow term="Challenges">{project.challenges.join(" ")}</DetailRow>
                <DetailRow term="Outcome">
                  {project.outcomes.length ? project.outcomes.join("; ") : "Measured outcomes to be added."}
                </DetailRow>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="musician-heading" className="mb-24">
        <ChapterHeading id="musician-heading" chapterId="musician" />
        <ul className="mt-8 space-y-2">
          {music.instruments.map((instrument) => (
            <li key={instrument.name} className="text-lg">
              {instrument.name}
              {instrument.note ? <span className="text-mute"> — {instrument.note}</span> : null}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-ink/85">Into {music.loves.join(", ").toLowerCase()}.</p>
        <p className="mt-3 text-ink/85">Favourite games: {music.games.charAt(0).toLowerCase() + music.games.slice(1)}</p>
      </section>

      <section aria-labelledby="human-heading">
        <ChapterHeading id="human-heading" chapterId="human" />
        <p className="mt-8 text-2xl leading-snug">Now, maybe we can build something together.</p>
        <ul className="mt-8 space-y-3">
          {contactLinks.map((link) => (
            <li key={link.id}>
              <ContactLinkItem
                link={link}
                className="text-lg underline decoration-cyan/50 underline-offset-4 hover:decoration-cyan"
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function ChapterHeading({ id, chapterId }: { id: string; chapterId: (typeof chapters)[number]["id"] }) {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  if (!chapter) return null;
  return (
    <div>
      <p className="font-mono text-sm text-mute">Chapter {chapter.number}</p>
      <h2 id={id} className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
        {chapter.title}
      </h2>
      <p className="mt-2 text-mute">{chapter.hint}</p>
    </div>
  );
}

function DetailRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <dt className="font-mono text-sm text-mute">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
