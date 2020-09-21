export async function fetchAPI(query: any, { variables }: any = {}) {
  const res = await fetch(`${process.env.API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const json = await res.json()
  if (json.errors) {
    console.error(json.errors)
    throw new Error("Failed to fetch API")
  }

  return json.data
}

export async function getArticles() {
  const data = await fetchAPI(`query Articles {
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
    }`)
  return data.articles
}

export async function getArticle(id: number) {
  const data = await fetchAPI(
    `query Articles($id: ID!) {
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
        }`,
    { variables: { id } }
  )
  return data.article
}

export async function getCategories() {
  const data = await fetchAPI(`query Categories {
    categories {
        id
        name
      }
    }`)
  return data.categories
}

export async function getCategory(id: number) {
  const data = await fetchAPI(
    `query Category($id: ID!) {
        category(id: $id) {
            name
            articles {
              id
              title
              content
              category {
                id
                name
              }
            }
          }
        }
    }
  `,
    { variables: { id } }
  )
  return data.category
}
