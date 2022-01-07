import React from "react"

interface Title {
  className?: string
}

const Title: React.FC<Title> = ({ className = "", children }) => {
  return <h2 className={`font-pilat ${className}`}>{children}</h2>
}

export default Title
