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
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
          rel="stylesheet"
        />
        <title key="page-title">{`Farnam Homayounfar - ${title}`}</title>
      </Head>
      <div className="flex flex-col min-h-screen justify-between">
        <Header />
        <main className="container mx-auto flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default MyLayout
