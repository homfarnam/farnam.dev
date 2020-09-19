import React from "react"

interface Title {
  className?: string
}

const Title: React.FC<Title> = ({ className = "", children }) => {
  return <h2 className={`text-6xl font-black ${className}`}>{children}</h2>
}

export default Title
