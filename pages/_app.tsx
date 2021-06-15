import "tailwindcss/tailwind.css"

import "../styles/index.css"
import "../public/fonts/pilat/stylesheet.css"
import { ApolloProvider } from "@apollo/react-hooks"
import withData from "../utils/apollo"
import Head from "next/head"
import { NextWebVitalsMetric } from "next/app"

function MyApp({ Component, pageProps, apollo }: any) {
  return (
    <>
      <ApolloProvider client={apollo}>
        <Head>
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>

        <Component {...pageProps} />
      </ApolloProvider>
    </>
  )
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log("metric: ", metric)
}

// Wraps all components in the tree with the data provider
export default withData(MyApp)
