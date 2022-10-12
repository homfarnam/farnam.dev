/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Categories
// ====================================================

export interface Categories_categories_data_attributes_image_data_attributes {
  __typename: "UploadFile";
  name: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  url: string;
}

export interface Categories_categories_data_attributes_image_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Categories_categories_data_attributes_image_data_attributes | null;
}

export interface Categories_categories_data_attributes_image {
  __typename: "UploadFileEntityResponse";
  data: Categories_categories_data_attributes_image_data | null;
}

export interface Categories_categories_data_attributes {
  __typename: "Category";
  name: string;
  slug: string | null;
  createdAt: any | null;
  image: Categories_categories_data_attributes_image | null;
}

export interface Categories_categories_data {
  __typename: "CategoryEntity";
  id: string | null;
  attributes: Categories_categories_data_attributes | null;
}

export interface Categories_categories {
  __typename: "CategoryEntityResponseCollection";
  data: Categories_categories_data[];
}

export interface Categories {
  categories: Categories_categories | null;
}
