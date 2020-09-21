/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Articles
// ====================================================

export interface Articles_articles_category {
  __typename: "Category"
  id: string
  name: string | null
}

export interface Articles_articles {
  __typename: "Articles"
  id: string
  title: string | null
  description: string | null
  category: Articles_articles_category | null
  published_at: any
}

export interface Articles {
  articles: (Articles_articles | null)[] | null
}
