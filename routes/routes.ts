export interface RouteType {
  href: string
  text: string
  color?: string
  withParams?: (param: string | undefined) => string
}

export const routes = {
  root: { href: "/", text: "Root" },
  aboutMe: {
    href: "/about-me",
    text: "About me",
  },
  contactMe: {
    href: "/contact-me",
    text: "Contact Me",
  },
}
