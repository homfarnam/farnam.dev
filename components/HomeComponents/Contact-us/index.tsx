import React from "react"
import styled from "styled-components"
import Image from "next/image"
import ChatIcon from "../../../public/chat.svg"

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
  return (
    <div className="h-full w-full my-20 flex flex-col justify-start">
      <h3 className="text-white my-5 text-4xl font-pilat font-bold">
        Stay in Touch
      </h3>
      <div className="flex flex-col xl:flex-row items-center justify-center lg:justify-start">
        <div className="hidden 2xl:block">
          <Image
            src={ChatIcon}
            alt="ChatIcon"
            className="z-20 transform lg:scale-65 xl:scale-85 2xl:scale-125"
          />
        </div>
        <ContactUsSection className="contact-us">
          <div className="space-y-4 mt-10 w-full">
            <div className="flex items-center w-1/2 name-input">
              <label
                htmlFor="name"
                className="italic absolute text-white font-semibold"
              >
                Name
              </label>
              <input type="text" className="pl-14 py-2 text-white w-full" />
            </div>
            <div className="flex items-center w-1/2 name-input">
              <label
                htmlFor="name"
                className="italic absolute text-white font-semibold"
              >
                Email
              </label>
              <input type="text" className="pl-14 py-2 text-white w-full" />
            </div>
            <div className="flex items-start w-1/2 name-input">
              <label
                htmlFor="name"
                className="italic absolute text-white font-semibold"
              >
                Message
              </label>
              <textarea className=" text-white w-full py-7 " />
            </div>
          </div>
        </ContactUsSection>
      </div>
      <div className="lg:w-full m-auto flex justify-end items-center py-3">
        <SubmitButton className="text-xl font-medium relative xl:-top-16 xl:-right-8">
          Submit
        </SubmitButton>
      </div>
    </div>
  )
}

export default ContactUs
