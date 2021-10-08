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

  border: 1px solid;
  border-image-slice: 1;

  border-image-source: radial-gradient(
    69.43% 69.43% at 50% 50%,
    #000000 0%,
    rgb(255 255 255 / 14%) 100%
  );
`

interface MeProps {}

const MyInfo: React.FC<MeProps> = () => {
  return (
    <>
      <div className="w-full flex h-auto justify-center mx-auto my-10">
        <Mydiv className="w-9/12 flex flex-col md:flex-row justify-between h-auto z-10 relative -right-24">
          <Image src={Farnam} alt="farnam" className="p-3" />

          <div className="flex flex-col w-full p-2 lg:p-3 space-y-4 font-custom">
            <p className="font-semibold  text-base xl:text-4xl">
              Hey. My Name Is Farnam. I Live In Iran And Tbh, My Main Interest
              Is Not Just Develop Stufs.
            </p>
            <p className="font-normal text-base  xl:text-4xl">
              I Totally Understand, You May Want To Work With Just A Programmer
              Who Know To Build Your Code. But Lets Take Another Look! Wouldnt
              It Better To Work With A Programmer Who Has Sense Of Art?
            </p>
            <p className="font-normal text-base  xl:text-4xl">
              Well As You Can See, I Play Violin. I Think When Things Are Messed
              Up, It Helps Me To Calm And Write Your Code More Perfect Than
              Ever. You See? I Play The Codes. Not Just Write Them.
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
