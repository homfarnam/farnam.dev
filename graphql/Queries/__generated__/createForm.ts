/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: createForm
// ====================================================

export interface createForm_createForm_data_attributes {
  __typename: "Form";
  name: string;
  email: string;
  description: string | null;
  createdAt: any | null;
}

export interface createForm_createForm_data {
  __typename: "FormEntity";
  id: string | null;
  attributes: createForm_createForm_data_attributes | null;
}

export interface createForm_createForm {
  __typename: "FormEntityResponse";
  data: createForm_createForm_data | null;
}

export interface createForm {
  createForm: createForm_createForm | null;
}

export interface createFormVariables {
  name: string;
  description: string;
  email: string;
}
