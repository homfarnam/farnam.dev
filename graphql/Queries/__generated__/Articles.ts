/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Articles
// ====================================================

export interface Articles_articles_data_attributes_Coverphoto_data_attributes {
  __typename: "UploadFile";
  name: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  url: string;
}

export interface Articles_articles_data_attributes_Coverphoto_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Articles_articles_data_attributes_Coverphoto_data_attributes | null;
}

export interface Articles_articles_data_attributes_Coverphoto {
  __typename: "UploadFileEntityResponse";
  data: Articles_articles_data_attributes_Coverphoto_data | null;
}

export interface Articles_articles_data_attributes {
  __typename: "Article";
  title: string;
  description: string;
  createdAt: any | null;
  Coverphoto: Articles_articles_data_attributes_Coverphoto;
}

export interface Articles_articles_data {
  __typename: "ArticleEntity";
  id: string | null;
  attributes: Articles_articles_data_attributes | null;
}

export interface Articles_articles {
  __typename: "ArticleEntityResponseCollection";
  data: Articles_articles_data[];
}

export interface Articles {
  articles: Articles_articles | null;
}
