import React from "react"
import styled from "styled-components"

const MainDiv = styled.p`
  text-overflow: ellipsis;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  color: white;
  font-weight: 100;
`

const TechCards: React.FC = () => {
  return (
    <div className="allCards">
      <div className="allCards__card">
        <div className="allCards__card--title">
          <p>JavaScript</p>
        </div>
        {/* <MainDiv className="items-center px-5 text-center lg:items-start lg:p-0 lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv> */}
      </div>
      <div className="allCards__card">
        <div className="allCards__card--title">
          <p>TypeScript</p>
        </div>
        {/* <MainDiv className="items-center px-5 text-center lg:items-start lg:p-0 lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv> */}
      </div>

      <div className="allCards__card">
        <div className="allCards__card--title">
          <p>React JS</p>
        </div>
        {/* <MainDiv className="items-center px-5 text-center lg:items-start lg:p-0 lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv> */}
      </div>

      <div className="allCards__card">
        <div className="allCards__card--title">
          <p>Next Js</p>
        </div>
        {/* <MainDiv className="items-center px-5 text-center lg:items-start lg:p-0 lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv> */}
      </div>
    </div>
  )
}

export default TechCards
