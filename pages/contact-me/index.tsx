import { MyLayout } from "../../wrappers"
import { FormikHelpers, Formik, Form } from "formik"
import { TextInput, Title } from "../../components"
import styled from "styled-components"

const MyButton = styled.button`
  border-radius: 999px;
  font-weight: 700;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-left: 2rem;
  padding-right: 2rem;
  background-color: #0984e3;
  @media (min-width: 640px) {
    line-height: 2.25rem;
  }
  :hover {
    background-color: #005ea6;
    transition: all 0.7s;
  }
`

const TextArea = styled.textarea`
  height: 200px;
  border-radius: 2rem;
`

interface ContactForm {
  firstname: string
  lastname: string
  email: string
  phone: string
}

const initialValues: ContactForm = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
}

const onSubmit = (
  _values: ContactForm,
  _formikHelpers: FormikHelpers<ContactForm>
) => {
  return
}

export default function ContactMe() {
  return (
    <MyLayout title="Contact Me">
      <div className="py-10">
        <Title className="flex justify-center text-6xl">Contact with Me</Title>
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          <Form id="login-form" className="flex flex-wrap space-y-4">
            <div className="w-full pb-10">
              <div className="flex flex-col flex-wrap justify-center w-6/12 mx-auto mb-9 lg:flex-no-wrap h-13">
                <TextInput
                  name="Firstname"
                  placeholder="First Name"
                  type="text"
                  borderRadius={"rounded-full"}
                  className="my-3"
                />
                <TextInput
                  name="Lastname"
                  placeholder="Last Name"
                  type="text"
                  borderRadius={"rounded-full"}
                />
                <TextInput
                  name="Email"
                  placeholder="Email Address"
                  type="email"
                  borderRadius={"rounded-full"}
                  className="my-3"
                />
                <TextArea name="textarea" className="border " />
                <MyButton
                  id="submit-button"
                  type="submit"
                  className="w-full mt-24 text-white lg:mt-10"
                >
                  Contact Us
                </MyButton>
              </div>
            </div>
          </Form>
        </Formik>
      </div>
    </MyLayout>
  )
}
