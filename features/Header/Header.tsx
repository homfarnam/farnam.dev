import React from "react"
import Link from "next/link"
import { routes } from "routes"
import styled from "styled-components"

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
  { href: routes.aboutMe.href, text: "About Me" },
  { href: routes.blog.href, text: "Blog" },
  { href: routes.blog.href, text: "Portfolio" },
  { href: routes.blog.href, text: "Resume" },
  { href: routes.contactMe.href, text: "Get In Touch" },
]

const Header: React.FC<HeaderProps> = () => {
  return (
    <MyHeader className="lg:px-16 px-6 flex flex-wrap justify-start items-center lg:py-0 py-2">
      <div className="flex justify-self-auto">
        <label
          htmlFor="menu-toggle"
          className="cursor-pointer lg:hidden block mt-2"
        >
          <svg
            className="fill-current text-gray-900"
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
        className="hidden lg:flex lg:items-center lg:w-auto w-full"
        id="menu"
      >
        <nav>
          <ul className="lg:flex items-center justify-between text-base font-mine text-white pt-4 lg:pt-0">
            {links.map((link) => (
              <li key={link.text}>
                <Link href={link.href} passHref>
                  <MyMenuLink className="lg:p-4 py-3 px-0 block border-b-2 border-transparent hover:border-indigo-400 ">
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
