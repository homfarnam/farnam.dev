import React from "react"

interface Title {
  className?: string
}

const Title: React.FC<Title> = ({ className = "", children }) => {
  return <h1 className={`text-6xl font-black ${className}`}>{children}</h1>
}

export default Title
