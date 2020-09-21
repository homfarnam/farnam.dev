import { gql } from "@apollo/client"

export const getArticle = gql`
  query Article($id: ID!) {
    article(id: $id) {
      id
      title
      description
      category {
        id
        name
      }
      published_at
    }
  }
`

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
      published_at
    }
  }
`
export const getCategories = gql`
  query Categories {
    categories {
      id
      name
    }
  }
`

export const getCategoryArticles = gql`
  query Category($id: ID!) {
    category(id: $id) {
      name
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
  }
`
