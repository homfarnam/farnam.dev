"use client";

import { contactLinks, profile, roles, skillGroups } from "@/data/profile";
import { projects } from "@/data/projects";
import { useExperience } from "@/stores/experienceStore";
import { ContactLinkItem } from "./ContactLinkItem";
import { Dialog } from "./Dialog";

/** The 30-second version for recruiters and engineering managers. */
export function DossierPanel() {
  const closeTopmost = useExperience((state) => state.closeTopmost);
  const goTo = useExperience((state) => state.goTo);
  const setTextMode = useExperience((state) => state.setTextMode);

  return (
    <Dialog title={`${profile.name} — ${profile.fullTitle}`} kicker="dossier / quick read" onClose={closeTopmost} width="lg">
      <p className="max-w-[62ch] text-lg leading-relaxed text-ink/90">{profile.intro}</p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-xs text-mute">Based in</dt>
          <dd className="mt-1">{profile.location}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs text-mute">Experience</dt>
          <dd className="mt-1">{profile.experienceYears}+ years shipping production frontends</dd>
        </div>
        <div>
          <dt className="font-mono text-xs text-mute">Now</dt>
          <dd className="mt-1">
            {roles[0]?.title} at {roles[0]?.company}
          </dd>
        </div>
      </dl>

      <h3 className="mt-10 font-mono text-xs text-cyan">Roles</h3>
      <ul className="mt-3 space-y-2">
        {roles.map((role) => (
          <li key={role.company}>
            <span className="text-ink">{role.company}</span>
            {role.context ? <span className="text-mute"> ({role.context})</span> : null}
            <span className="text-mute"> — {role.summary}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-10 font-mono text-xs text-cyan">Stack</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {skillGroups.map((group) => (
          <div key={group.id}>
            <dt className="text-sm text-mute">{group.label}</dt>
            <dd className="text-sm">{group.items.join(", ")}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-10 font-mono text-xs text-cyan">Selected work</h3>
      <ul className="mt-3 space-y-1.5 text-sm">
        {projects.map((project) => (
          <li key={project.id}>
            <span className="text-ink">{project.name}</span> <span className="text-mute">— {project.oneLiner}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6 text-sm">
        {contactLinks.map((link) => (
          <ContactLinkItem
            key={link.id}
            link={link}
            className="underline decoration-cyan/50 underline-offset-4 hover:decoration-cyan"
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => goTo("creator")}
          className="bg-ember px-4 py-2 text-sm font-medium text-void hover:brightness-110"
        >
          Open the project vault
        </button>
        <button
          type="button"
          onClick={() => setTextMode(true)}
          className="border border-line px-4 py-2 text-sm hover:border-cyan"
        >
          Read everything as text
        </button>
      </div>
    </Dialog>
  );
}
