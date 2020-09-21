/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Article
// ====================================================

export interface Article_article_category {
  __typename: "Category"
  id: string
  name: string | null
}

export interface Article_article {
  __typename: "Articles"
  id: string
  title: string | null
  description: string | null
  category: Article_article_category | null
  published_at: any
}

export interface Article {
  article: Article_article | null
}

export interface ArticleVariables {
  id: string
}
