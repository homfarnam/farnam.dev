import gql from "graphql-tag"

const ARTICLES_QUERY = gql`
  query Articles {
    articles {
      id
      title
      description
      category {
        id
        name
      }
    }
  }
`

export default ARTICLES_QUERY
