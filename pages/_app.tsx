import "tailwindcss/tailwind.css"

import "../styles/index.css"
import "../styles/index.scss"
import "../public/fonts/pilat/stylesheet.css"
import { ApolloProvider } from "@apollo/react-hooks"
import { useApollo } from "../utils/apollo"
import Head from "next/head"
import { NextWebVitalsMetric } from "next/app"

// @graphql-codegen/typescript-react-apollo@1.17.8

function MyApp({ Component, pageProps }: any) {
  const client = useApollo(pageProps.initialApolloState)

  return (
    <>
      <ApolloProvider client={client as any}>
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

// export function reportWebVitals(metric: NextWebVitalsMetric) {
//   console.log("metric: ", metric)
// }

// Wraps all components in the tree with the data provider
export default MyApp
