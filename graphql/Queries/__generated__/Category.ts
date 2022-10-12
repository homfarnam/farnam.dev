/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Category
// ====================================================

export interface Category_category_data_attributes_image_data_attributes {
  __typename: "UploadFile";
  name: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  url: string;
}

export interface Category_category_data_attributes_image_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Category_category_data_attributes_image_data_attributes | null;
}

export interface Category_category_data_attributes_image {
  __typename: "UploadFileEntityResponse";
  data: Category_category_data_attributes_image_data | null;
}

export interface Category_category_data_attributes {
  __typename: "Category";
  name: string;
  slug: string | null;
  createdAt: any | null;
  image: Category_category_data_attributes_image | null;
}

export interface Category_category_data {
  __typename: "CategoryEntity";
  id: string | null;
  attributes: Category_category_data_attributes | null;
}

export interface Category_category {
  __typename: "CategoryEntityResponse";
  data: Category_category_data | null;
}

export interface Category {
  category: Category_category | null;
}

export interface CategoryVariables {
  id: string;
}
