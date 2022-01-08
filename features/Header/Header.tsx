import React from "react"
import Link from "next/link"
import styled from "styled-components"
import { routes } from "../../routes"

const MyHeader = styled.header`
  #menu-toggle:checked + #menu {
    display: block;
    transition: all ease-in 2s step-start;
  }
`
const MyMenuLink = styled.a`
  font-family: "Titillium Web", sans-serif;
  text-decoration: none !important;
`

interface HeaderProps {}

const links = [
  { href: routes.root.href, text: "Home" },
  // { href: routes.aboutMe.href, text: "About Me" },
  { href: routes.blog.href, text: "Blog" },
  // { href: routes.blog.href, text: "Portfolio" },
  { href: routes.resume.href, text: "Resume" },
  // { href: routes.contactMe.href, text: "Get In Touch" },
]

const Header: React.FC<HeaderProps> = () => {
  return (
    <MyHeader className="flex flex-wrap items-center justify-start px-6 py-2 lg:px-16 lg:py-0">
      <div className="flex justify-self-auto">
        <label
          htmlFor="menu-toggle"
          className="block mt-2 cursor-pointer lg:hidden"
        >
          <svg
            className="text-gray-900 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
          >
            <title>menu</title>
            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
          </svg>
        </label>

        <input className="hidden" type="checkbox" id="menu-toggle" />
      </div>

      <div
        className="hidden w-full lg:flex lg:items-center lg:w-auto"
        id="menu"
      >
        <nav>
          <ul className="items-center justify-between pt-4 text-base text-white lg:flex font-mine lg:pt-0">
            {links.map((link) => (
              <li key={link.text}>
                <Link href={link.href} passHref>
                  <MyMenuLink className="block px-0 py-3 border-b-2 border-transparent lg:p-4 hover:border-indigo-400 ">
                    {link.text}
                  </MyMenuLink>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </MyHeader>
  )
}

export default Header
