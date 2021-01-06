import { BackText, Bio, MyPic, MyTitle } from "./styles"

interface HeroProps {
  className?: string
}

const Hero: React.FC<HeroProps> = ({ className = "" }) => {
  return (
    <div
      className={`flex flex-col lg:flex-row justify-center lg:justify-around items-center ${className}`}
    >
      <div className="flex flex-col items-start">
        <BackText>Hello.</BackText>
        <div className="z-10 flex flex-col w-screen lg:w-auto items-start lg:justify-center mx-20 lg:mx-auto lg:px-0">
          <MyTitle className="text-2xl font-extrabold lg:text-4xl flex w-full lg:w-auto justify-center pb-8">
            Hi, I’m Farnam Homayounfar.
          </MyTitle>
          <Bio className="flex flex-col justify-center ml-5 lg:ml-auto px-3 lg:px-0">
            <p className="text-Hero-subtitle text-3xl mb-3">Who I am?</p>
            <div className="mt-2">
              <p>
                I’m a freelance Frontend Developer. I develop systems to help my
                clients be more independant and grow their bussiness easily.
              </p>
              <p>
                So far, I helped Legaler, Canymess, Hawei Center, Paklean and
                many more.
              </p>
              <p>You can find my work on Github.</p>
            </div>
          </Bio>
        </div>
      </div>

      <div className="flex flex-row justify-center w-full lg:w-auto">
        <MyPic src="/violin.jpeg" alt="violin" />
      </div>
    </div>
  )
}

export default Hero
