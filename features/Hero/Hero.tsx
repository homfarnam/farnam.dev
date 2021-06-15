import Button from "@components/Button"
import Image from "next/image"
import styled from "styled-components"
import codehtml from "../../public/codehtml.svg"

const GlassCard = styled.div`
  position: absolute;
  width: 320px;
  height: 448px;
  left: 975px;
  top: 234px;

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
        />
        <div className="z-10 flex flex-row w-screen lg:w-auto items-start justify-start ">
          <div className="flex flex-row justify-between ml-5 px-3 w-full ">
            <div className="mt-2 flex-col text-white text-4xl w-1/2 space-y-5">
              <p className="leading-10 font-normal font-pilat">
                Well, it it new era and for success in it, you need new era’s
                developer. thats who am i.
              </p>
              <p className="font-thin font-apparel">
                Feel Free To get in touch and see my work
              </p>
              <Button variant="black">See more </Button>
            </div>
            <div className="z-0">
              <Image
                src="/Sphere_gold.svg"
                className="z-30"
                layout="fixed"
                width={338}
                height={338}
                objectFit="cover"
              />
            </div>
            <GlassCard className="z-20  ml-[200px] -mt-32">
              <Code className="z-50 relative right-52 -top-28">
                <Image
                  src={codehtml}
                  className="z-30"
                  layout="fixed"
                  width={720}
                  height={720}
                  objectFit="cover"
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
