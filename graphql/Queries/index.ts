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
      image {
        id
        alternativeText
        url
        width
        height
      }
      published_at
    }
  }
`

export const getArticleWithID = gql`
  query ArticleId($id: ID!) {
    articles(where: { id: $id }) {
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
      image {
        id
        alternativeText
        url
        width
        height
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
      image {
        id
        name
        url
        width
        height
        alternativeText
      }
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
