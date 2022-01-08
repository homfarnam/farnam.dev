import React from "react"
import styled from "styled-components"

const Card = styled.div`
  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(102px);
  width: 80%;
  padding: 15px;
  font-family: "Montserrat", "sans-serif";

  border: 1px solid;
  border-image-slice: 1;

  border-image-source: radial-gradient(
    69.43% 69.43% at 50% 50%,
    #ffffff 0%,
    rgba(255, 255, 255, 0) 100%
  );
  p {
    background: -webkit-linear-gradient(
      86deg,
      #ffffff -23.37%,
      rgb(255 255 255 / 0%) 76.11%
    );

    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: Pilat Extended;
    font-style: normal;
    font-weight: 950;
    line-height: 72px;
    text-align: left;
    text-overflow: ellipsis;
  }
`

const MainDiv = styled.p`
  text-overflow: ellipsis;
  padding-left: 1.25rem /* 20px */;
  padding-right: 1.25rem /* 20px */;
  margin-top: 1.25rem /* 20px */;
  margin-bottom: 1.25rem /* 20px */;
  color: white;
  font-weight: 100;
`

const TechCards: React.FC = () => {
  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center lg:justify-around my-10 text-3xl">
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/4 w-full">
        <Card>
          <p>JS</p>
        </Card>
        <MainDiv className="lg:items-start items-center px-5 lg:p-0 text-center lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv>
      </div>
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/4 w-full">
        <Card>
          <p>TS</p>
        </Card>
        <MainDiv className="lg:items-start items-center px-5 lg:p-0 text-center lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv>
      </div>

      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/4 w-full">
        <Card>
          <p>React JS</p>
        </Card>
        <MainDiv className="lg:items-start items-center px-5 lg:p-0 text-center lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv>
      </div>

      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/4 w-full">
        <Card>
          <p>Next Js</p>
        </Card>
        <MainDiv className="lg:items-start items-center px-5 lg:p-0 text-center lg:text-left">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh
        </MainDiv>
      </div>
    </div>
  )
}

export default TechCards
