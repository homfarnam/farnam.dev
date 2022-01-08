/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Article
// ====================================================

export interface Article_article_category {
  __typename: "Category";
  id: string;
  name: string;
}

export interface Article_article_image {
  __typename: "UploadFile";
  id: string;
  alternativeText: string | null;
  url: string;
  width: number | null;
  height: number | null;
}

export interface Article_article {
  __typename: "Article";
  id: string;
  title: string;
  description: string;
  category: Article_article_category | null;
  image: Article_article_image | null;
  published_at: any | null;
}

export interface Article {
  article: Article_article | null;
}

export interface ArticleVariables {
  id: string;
}
