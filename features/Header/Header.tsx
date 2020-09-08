import React from "react"
import Link from "next/link"
import { routes } from "routes"

interface HeaderProps {}

const links = [
  { href: routes.root.href, text: "Home" },
  { href: routes.contactMe.href, text: "Contact Me" },
  { href: routes.aboutMe.href, text: "About Me" },
]

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-white shadow-header">
      <nav className="container mx-auto flex items-center justify-center flex-wrap p-2 sm:p-5">
        {links.map((link) => (
          <Link key={link.text} href={link.href}>
            <a className="block lg:inline-block mt-4 lg:mt-0 mr-8 align-middle">
              {link.text}
            </a>
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default Header
