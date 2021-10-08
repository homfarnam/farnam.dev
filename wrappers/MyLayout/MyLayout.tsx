import Head from "next/head"
import * as React from "react"
import { Header } from "features"
import styled from "styled-components"

interface MyLayoutProps {
  title?: string
}

const BackG = styled.div`
  background-image: url("/union.png");
  background-repeat: no-repeat;
  background-size: cover;
`

const MyLayout: React.FC<MyLayoutProps> = ({ children, title }) => {
  return (
    <>
      <Head>
        <link
          rel="preload"
          href="../../public/fonts/Syne-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="../../public/fonts/Syne-Medium.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="../../public/fonts/Blacker-Text-Light-trial.ttf"
          as="font"
          crossOrigin=""
        />
        <title key="page-title">{`Farnam Homayounfard - ${title}`}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta property="og:title" content="Farnam Homayounfar" />
        <meta property="og:description" content="Frontend developer" />
        <meta name="Description" content="Frontend developer" />
      </Head>
      <BackG className="flex flex-col w-full min-h-screen justify-between">
        <Header />
        <main className="container mx-auto flex-grow ">{children}</main>
        {/* <Footer /> */}
      </BackG>
    </>
  )
}

export default MyLayout
