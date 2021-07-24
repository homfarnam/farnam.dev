import Image from "next/image"
import * as React from "react"
import styled from "styled-components"
import Farnam from "../../public/farnam.png"
import Round from "../../public/RoundCube-White-Matte.svg"

const Mydiv = styled.div`
  position: relative;

  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 16px;
`

interface MeProps {}

const MyInfo: React.FC<MeProps> = () => {
  return (
    <>
      <div className="w-full flex h-auto justify-center mx-auto my-10">
        <Mydiv className="w-9/12 flex flex-col md:flex-row justify-between h-auto z-10 relative -right-24">
          <Image src={Farnam} alt="farnam" className="p-3" />

          <div className="flex flex-col w-full p-2 lg:p-3 space-y-4 font-Montserrat_Alternate">
            <p className="font-semibold  text-base xl:text-4xl">
              Hey. my name is Farnam. I live in Iran and tbh, my main interest
              is not just develop stufs.
            </p>
            <p className="font-normal text-base  xl:text-4xl">
              I totally understand, you may want to work with just a programmer
              who know to build your code. but lets take another look! Wouldnt
              it better to work with a programmer who has sense of Art?
            </p>
            <p className="font-normal text-base  xl:text-4xl">
              Well as you can see, i play violin. i think when things are messed
              up, it helps me to calm and write your code more perfect than
              ever. you see? i play the codes. not just write them.
            </p>
          </div>
        </Mydiv>
        <div className="relative -left-16">
          <Image src={Round} alt="Round" className="z-0 relative -left-8" />
        </div>
      </div>
    </>
  )
}

export default MyInfo
