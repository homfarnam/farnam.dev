import gql from "graphql-tag"

export const getArticles = gql`
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

export default getArticles
