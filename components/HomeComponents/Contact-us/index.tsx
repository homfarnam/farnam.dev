import React, { useState } from "react"
import styled from "styled-components"
import Image from "next/image"
import ChatIcon from "../../../public/chat.svg"
import { useMutation } from "@apollo/client"
import { createForm } from "graphql/Queries/mutation"

const ContactUsSection = styled.div`
  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 26px;

  border: 1px solid;
  border-image-slice: 1;

  border-image-source: radial-gradient(
    69.43% 69.43% at 50% 50%,
    #ffffff 0%,
    rgba(255, 255, 255, 0) 100%
  );

  .name-input {
    input {
      background: transparent;
      border-bottom: 2px solid #394c55;
      transition: all 0.3s ease-in;
      :focus-visible {
        border-bottom-color: whitesmoke;
        outline: none !important;
        border-bottom: 3px solid;
      }
    }
    textarea {
      background: transparent;
      border-bottom: 2px solid #2b383f;
      transition: all 0.3s ease-in;
      :focus-visible {
        border-bottom-color: whitesmoke;
        outline: none !important;
        border-bottom: 3px solid;
      }
    }
  }
`

const SubmitButton = styled.button`
  z-index: 99;
  width: 268px;
  height: 72px;

  background: rgba(255, 255, 255, 0.16);
  box-shadow: 0px 14.3333px 28.6667px rgba(27, 27, 27, 0.16);
  backdrop-filter: blur(57.3333px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 11px;

  border: 3.58px solid;
  border-image-slice: 1;

  border-image-source: linear-gradient(
    150.43deg,
    rgba(255, 255, 255, 0.24) 0%,
    rgba(255, 255, 255, 0) 61.87%
  );
`

const ContactUs: React.FC = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")

  const [addToForm] = useMutation(createForm, {
    onError: (err) => {
      console.log(err)
    },
    onCompleted: (data) => {
      alert("Form submitted successfully")
      console.log(data)
    },
  })

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value)
  }

  return (
    <div className="flex flex-col justify-start w-full h-full my-20">
      <h3 className="my-5 text-4xl font-bold text-white font-pilat">
        Stay in Touch
      </h3>
      <div className="flex flex-col items-center justify-center xl:flex-row lg:justify-start">
        <div className="hidden 2xl:block">
          <Image
            src={ChatIcon}
            alt="ChatIcon"
            className="z-20 transform lg:scale-65 xl:scale-85 2xl:scale-125"
          />
        </div>
        <ContactUsSection className="contact-us">
          <div className="w-full mt-10 space-y-4">
            <div className="flex items-center w-full lg:w-1/2 name-input">
              <label
                htmlFor="name"
                className="absolute italic font-semibold text-white"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full py-2 text-white pl-14"
                value={name}
                onChange={handleNameChange}
              />
            </div>
            <div className="flex items-center w-full lg:w-1/2 name-input">
              <label
                htmlFor="email"
                className="absolute italic font-semibold text-white"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                className="w-full py-2 text-white pl-14"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            <div className="flex items-start w-full lg:w-1/2 name-input">
              <label
                htmlFor="message"
                className="absolute italic font-semibold text-white"
              >
                Message
              </label>
              <textarea
                value={description}
                className="w-full text-white py-7"
                id="message"
                onChange={handleDescriptionChange}
              />
            </div>
          </div>
        </ContactUsSection>
      </div>
      <div className="flex items-center justify-end py-3 m-auto lg:w-full">
        <SubmitButton
          onClick={() => {
            addToForm({
              variables: {
                name,
                description,
                email,
              },
            })
          }}
          className="relative text-xl font-medium xl:-top-16 xl:-right-8"
        >
          Submit
        </SubmitButton>
      </div>
    </div>
  )
}

export default ContactUs
