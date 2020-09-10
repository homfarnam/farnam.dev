import styled from "styled-components"

interface HeroProps {
  className?: string
}

const MyTitle = styled.h1`
  font-family: "Pacifico", cursive;
  text-transform: capitalize;
`

const Hero: React.FC<HeroProps> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col justify-center ${className}`}>
      <MyTitle className="text-3xl md:text-6xl flex justify-center pb-8">
        Farnam Homayounfar
      </MyTitle>
      <h3 className="text-2xl flex justify-center">Frontend developer</h3>
    </div>
  )
}

export default Hero
