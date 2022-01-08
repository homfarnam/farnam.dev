import Head from "next/head"
import styled from "styled-components"
import { HTMLAttributes } from "react"
import { Header } from "../../features"

interface MyLayoutProps {
  title?: string
  noBg?: boolean
  children: React.ReactNode
  className?: HTMLAttributes<HTMLDivElement>["className"]
}

const MyLayout: React.FC<MyLayoutProps> = ({
  children,
  title,
  noBg,
  className = "",
}) => {
  const BackG = styled.div`
    background-image: ${(_props) => (noBg ? "" : 'url("/union.png")')};
    background-repeat: no-repeat;
    background-size: cover;
  `

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
      <BackG className={`flex flex-col justify-between w-full min-h-screen`}>
        <main className={`${className}`}>
          <Header />
          {children}
        </main>
        {/* <Footer /> */}
      </BackG>
    </>
  )
}

export default MyLayout
