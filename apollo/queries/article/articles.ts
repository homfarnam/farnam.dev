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
      image {
        id
        alternativeText
        url
        width
        height
      }
    }
  }
`

export default getArticles
