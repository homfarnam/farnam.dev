import { StoryDocument } from "@/components/document/StoryDocument";
import { ExperienceLoader } from "@/components/experience/ExperienceLoader";
import { contactLinks, isPlaceholder, profile, skillGroups } from "@/data/profile";

function personJsonLd() {
  const sameAs = contactLinks
    .filter((link) => link.id === "linkedin" || link.id === "github")
    .map((link) => link.href)
    .filter((href) => !isPlaceholder(href));
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.fullTitle,
    url: profile.siteUrl,
    address: { "@type": "PostalAddress", addressLocality: "Amsterdam", addressCountry: "NL" },
    worksFor: { "@type": "Organization", name: "Eltemate" },
    knowsAbout: skillGroups.flatMap((group) => group.items),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
      <StoryDocument />
      <ExperienceLoader />
    </>
  );
}
