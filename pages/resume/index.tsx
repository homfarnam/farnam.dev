import Image from "next/image"

import { MyLayout } from "wrappers"
import { Articles_articles } from "graphql/Queries/__generated__/Articles"
// import styled from "styled-components"
import FHImage from "../../public/fh.png"
import useWindowSize from "hooks/useWindowSize"

interface Blog {
  data: Articles_articles[]
}

// const FH = styled.div`
//   background-image: url("/fh.png");
//   background-repeat: no-repeat;
//   background-size: cover;
//   object-fit: contain;

//   height: 100vh;
//   width: 50%;
// `

const Resume: React.FC<Blog> = () => {
  const size = useWindowSize()
  return (
    <MyLayout noBg className="resume" title="Resume">
      <div className="resume__main">
        <div className="resume__main--image">
          {size > 1024 && (
            <Image
              src={FHImage}
              alt="fh"
              layout="intrinsic"
              objectFit="contain"
              loading="lazy"
              width={1000}
              height={1000}
            />
          )}

          {/* <FH /> */}
        </div>
        <div className="resume__main--me">
          <div>
            <h3 className="">
              <span>Hey, </span>
              <p>
                I am <strong className="">Farnam</strong>
              </p>
            </h3>
            <span className="">Frontend developer</span>
            <button className="cvButton2">Hire me</button>
          </div>
        </div>
        <div className="resume__main--about">
          <span className="">Based in Iran</span>
          <p>
            congolium sic ad nauseum. Souvlaki ignitus carborundum e pluribus
            unum. Defacto lingo est igpay atinlay. Marquee selectus
          </p>
          <button className="cvButton2">Download CV</button>
        </div>
      </div>
    </MyLayout>
  )
}

export default Resume
