import { gql } from "@apollo/client"

const createForm = gql`
  mutation createForm($name: String!, $description: String!, $email: String!) {
    createForm(
      data: { name: $name, description: $description, email: $email }
    ) {
      data {
        id
        attributes {
          name
          email
          description
          createdAt
        }
      }
    }
  }
`

export { createForm }
