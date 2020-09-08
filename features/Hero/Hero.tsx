interface HeroProps {
  className?: string
}

const Hero: React.FC<HeroProps> = ({ className = "" }) => {
  return (
    <div className={`flex flex-col justify-center ${className}`}>
      <h1 className="text-5xl flex justify-center">Farnam Homayounfar</h1>
      <h3 className="text-2xl flex justify-center">Frontend developer</h3>
    </div>
  )
}

export default Hero
