import { gql } from "@apollo/client"

export const getOneArticle = gql`
  query Article($id: ID!) {
    article(id: $id) {
      data {
        id
        attributes {
          title
          description
          createdAt
          Coverphoto {
            data {
              id
              attributes {
                name
                alternativeText
                width
                height
                url
              }
            }
          }
        }
      }
    }
  }
`

export const getArticles = gql`
  query Articles {
    articles {
      data {
        id
        attributes {
          title
          description
          createdAt
          Coverphoto {
            data {
              id
              attributes {
                name
                alternativeText
                width
                height
                url
              }
            }
          }
        }
      }
    }
  }
`

export const getCategories = gql`
  query Categories {
    categories {
      data {
        id
        attributes {
          name
          slug
          createdAt
          image {
            data {
              id
              attributes {
                name
                alternativeText
                width
                height
                url
              }
            }
          }
        }
      }
    }
  }
`

export const getOneCategory = gql`
  query Category($id: ID!) {
    category(id: $id) {
      data {
        id
        attributes {
          name
          slug
          createdAt
          image {
            data {
              id
              attributes {
                name
                alternativeText
                width
                height
                url
              }
            }
          }
        }
      }
    }
  }
`
