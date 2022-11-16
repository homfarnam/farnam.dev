/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Article
// ====================================================

export interface Article_article_data_attributes_Coverphoto_data_attributes {
  __typename: "UploadFile";
  name: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  url: string;
}

export interface Article_article_data_attributes_Coverphoto_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Article_article_data_attributes_Coverphoto_data_attributes | null;
}

export interface Article_article_data_attributes_Coverphoto {
  __typename: "UploadFileEntityResponse";
  data: Article_article_data_attributes_Coverphoto_data | null;
}

export interface Article_article_data_attributes {
  __typename: "Article";
  title: string;
  description: string;
  createdAt: any | null;
  Coverphoto: Article_article_data_attributes_Coverphoto;
}

export interface Article_article_data {
  __typename: "ArticleEntity";
  id: string | null;
  attributes: Article_article_data_attributes | null;
}

export interface Article_article {
  __typename: "ArticleEntityResponse";
  data: Article_article_data | null;
}

export interface Article {
  article: Article_article | null;
}

export interface ArticleVariables {
  id: string;
}
