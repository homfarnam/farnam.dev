/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Category
// ====================================================

export interface Category_category_articles_category {
  __typename: "Category";
  id: string;
  name: string;
}

export interface Category_category_articles {
  __typename: "Article";
  id: string;
  title: string;
  description: string;
  category: Category_category_articles_category | null;
}

export interface Category_category {
  __typename: "Category";
  name: string;
  articles: (Category_category_articles | null)[] | null;
}

export interface Category {
  category: Category_category | null;
}

export interface CategoryVariables {
  id: string;
}
