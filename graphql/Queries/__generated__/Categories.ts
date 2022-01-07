/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Categories
// ====================================================

export interface Categories_categories_image {
  __typename: "UploadFile";
  id: string;
  name: string;
  url: string;
  width: number | null;
  height: number | null;
  alternativeText: string | null;
}

export interface Categories_categories {
  __typename: "Category";
  id: string;
  name: string;
  image: Categories_categories_image | null;
}

export interface Categories {
  categories: (Categories_categories | null)[] | null;
}
