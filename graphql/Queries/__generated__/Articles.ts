/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Articles
// ====================================================

export interface Articles_articles_category {
  __typename: "Category";
  id: string;
  name: string;
}

export interface Articles_articles_image {
  __typename: "UploadFile";
  id: string;
  alternativeText: string | null;
  url: string;
  width: number | null;
  height: number | null;
}

export interface Articles_articles {
  __typename: "Article";
  id: string;
  title: string;
  description: string;
  category: Articles_articles_category | null;
  image: Articles_articles_image | null;
  published_at: any | null;
}

export interface Articles {
  articles: (Articles_articles | null)[] | null;
}
