import { isPlaceholder, type ContactLink } from "@/data/profile";

interface ContactLinkItemProps {
  link: ContactLink;
  className?: string;
}

/** Renders a real link, or a visibly pending one when the URL hasn't been supplied yet. */
export function ContactLinkItem({ link, className = "" }: ContactLinkItemProps) {
  if (isPlaceholder(link.href)) {
    return (
      <span className={`${className} cursor-not-allowed opacity-60`} aria-disabled="true" title="Link not added yet">
        {link.verb}
        <span className="ml-2 font-mono text-[0.7em] text-ember">pending</span>
      </span>
    );
  }
  const external = !link.href.startsWith("mailto:") && !link.href.startsWith("/");
  return (
    <a className={className} href={link.href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {link.verb}
    </a>
  );
}
