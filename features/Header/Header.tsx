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
  text-decoration: none !important;
`

interface HeaderProps {}

const links = [
  { href: routes.root.href, text: "Home" },
  { href: routes.blog.href, text: "Blog" },
  { href: routes.contactMe.href, text: "Contact Me" },
  { href: routes.aboutMe.href, text: "About Me" },
]

const Header: React.FC<HeaderProps> = () => {
  return (
    <MyHeader className="lg:px-16 px-6 bg-white flex flex-wrap items-center lg:py-0 py-2">
      <div className="flex-1 flex justify-between items-center"></div>
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

      <div
        className="hidden lg:flex lg:items-center lg:w-auto w-full"
        id="menu"
      >
        <nav>
          <ul className="lg:flex items-center justify-between text-base text-gray-700 pt-4 lg:pt-0">
            {links.map((link) => (
              <Link key={link.text} href={link.href}>
                <li>
                  <MyMenuLink className="lg:p-4 py-3 px-0 block border-b-2 border-transparent hover:border-indigo-400 ">
                    {link.text}
                  </MyMenuLink>
                </li>
              </Link>
            ))}
          </ul>
        </nav>
        <a
          href="#"
          className="lg:ml-4 hidden lg:flex items-center justify-start lg:mb-0 cursor-pointer"
        >
          <img
            src="./farnam.jpg"
            alt="farnamh"
            className="rounded-full w-10 h-10 border-2 border-transparent hover:border-indigo-400"
          />
        </a>
      </div>
    </MyHeader>
  )
}

export default Header

// <nav className="container mx-auto flex items-center justify-center flex-wrap p-2 sm:p-5">
// {links.map((link) => (
//   <Link key={link.text} href={link.href}>
//     <a className="block lg:inline-block mt-4 lg:mt-0 mr-8 align-middle text-2xl text-blue-600">
//       {link.text}
//     </a>
//   </Link>
// ))}
// </nav>
