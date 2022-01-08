import { Button } from "../../components"
import Image from "next/image"
import styled from "styled-components"
import codehtml from "../../public/codehtml.svg"

const GlassCard = styled.div`
  position: absolute;
  width: 320px;
  height: 448px;

  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 16px;
`

const Code = styled.div`
  filter: drop-shadow(0px 4px 60px rgba(0, 0, 0, 0.25));
`

interface HeroProps {
  className?: string
}

const Hero: React.FC<HeroProps> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col lg:flex-row  items-center ${className}`}>
      <div className="flex flex-col items-start">
        <Image
          src="/sphere.svg"
          layout="fixed"
          width={186}
          height={186}
          objectFit="cover"
          loading="lazy"
          alt="sphere"
        />
        <div className="z-10 flex flex-row   xl:w-auto items-center justify-center ">
          <div className="flex flex-row flex-wrap space-y-48 xl:space-y-0 lg:mb-0 justify-center items-center xl:justify-between m-auto lg:ml-5 lg:px-3 w-full">
            <div className="mt-2 flex-col text-white text-4xl w-full md:w-1/2 space-y-5">
              <p className="leading-10 font-normal font-pilat">
                Well, it it new era and for success in it, you need new era’s
                developer. thats who am i.
              </p>
              <p className="font-thin font-apparel">
                Feel Free To get in touch and see my work
              </p>
              <div className="w-full flex justify-start">
                <Button className="bg-[#FFB703] mt-5 font-custom font-bold">
                  See my works
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center px-10 lg:p-0 transform scale-75 md:scale-100">
              <div className="z-0">
                <Image
                  src="/Sphere_gold.svg"
                  className="z-30"
                  layout="fixed"
                  width={338}
                  height={338}
                  objectFit="cover"
                  loading="lazy"
                  alt="sphere-gold"
                />
              </div>
              <GlassCard className="z-20 -mt-32">
                <Code className="z-50 relative right-52 -top-28">
                  <Image
                    src={codehtml}
                    className="z-30"
                    layout="fixed"
                    width={600}
                    height={600}
                    objectFit="cover"
                    loading="lazy"
                    alt="codehtml"
                  />
                </Code>
              </GlassCard>
              <div className="relative -top-56">
                <Image
                  src="/Color-Black-Matte.svg"
                  layout="fixed"
                  width={186}
                  height={186}
                  objectFit="cover"
                  loading="lazy"
                  alt="Color-Black-Matte"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
