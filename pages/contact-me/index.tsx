import { MyLayout } from "wrappers"
import { FormikHelpers, Formik, Form } from "formik"
import { TextInput, Button } from "components"

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
    <MyLayout title="Farnam Homayounfar">
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        <Form id="login-form" className="space-y-4 flex flex-wrap">
          <div className="w-full ">
            <div className="flex mb-9 flex-col lg:flex-row  flex-wrap lg:flex-no-wrap ">
              <div className="w-full h-13">
                <TextInput
                  name="Firstname"
                  placeholder="First Name"
                  type="text"
                  borderRadius={"rounded-full"}
                  className="my-3 mr-3"
                />
                <TextInput
                  name="Lastname"
                  placeholder="Last Name"
                  type="text"
                  borderRadius={"rounded-full"}
                  className="mr-3"
                />
              </div>
              <div className="w-full    h-12">
                <TextInput
                  name="Email"
                  placeholder="Email Address"
                  type="email"
                  borderRadius={"rounded-full"}
                  className="my-3 "
                />
                <TextInput
                  name="Phone"
                  placeholder="Phone Number"
                  type="number"
                  borderRadius={"rounded-full"}
                />
              </div>
            </div>
            <Button
              id="submit-button"
              type="submit"
              className="w-full mt-24 lg:mt-10 text-white bg-accent"
            >
              Contact Us
            </Button>
          </div>
        </Form>
      </Formik>
    </MyLayout>
  )
}
