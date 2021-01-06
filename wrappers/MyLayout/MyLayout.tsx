import Head from "next/head"
import * as React from "react"
import { Header, Footer } from "features"

interface MyLayoutProps {
  title?: string
}

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
        <title key="page-title">{`Farnam Homayounfar - ${title}`}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta property="og:title" content="Farnam Homayounfar" />
        <meta property="og:description" content="Frontend developer" />
        <meta name="Description" content="Frontend developer" />
      </Head>
      <div className="flex flex-col min-h-screen justify-between bg-backbody-100">
        <Header />
        <main className="container mx-auto flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default MyLayout
