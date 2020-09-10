import "../styles/index.css"
import { AppProps } from "next/app"
// import { ApolloProvider } from "@apollo/react-hooks"
import withData from "../utils/apollo"
import Head from "next/head"
// import { ApolloClient } from "apollo-client"

// const client = new ApolloClient({
//   uri: "https://48p1r2roz4.sse.codesandbox.io",
// })

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Staatliches"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/uikit@3.2.3/dist/css/uikit.min.css"
        />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.2.0/js/uikit.min.js" />
        <script src="https://cdn.jsdelivr.net/npm/uikit@3.2.3/dist/js/uikit-icons.min.js" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.2.0/js/uikit.js" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

// Wraps all components in the tree with the data provider
export default withData(MyApp)
