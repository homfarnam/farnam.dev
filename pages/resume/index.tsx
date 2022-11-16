import Image from "next/image"

import { MyLayout } from "../../wrappers"
import { Articles_articles } from "../../graphql/Queries/__generated__/Articles"
// import styled from "styled-components"
import FHImage from "../../public/fh.png"
import useWindowSize from "../../hooks/useWindowSize"
import Link from "next/link"

interface Blog {
  data: Articles_articles[]
}

const Resume: React.FC<Blog> = () => {
  const size = useWindowSize()
  return (
    <MyLayout noBg bgColor="#08172E" className="resume" title="Resume">
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
            <Link href="mailto:homfarnam@gmail.com" passHref>
              <button className="cvButton2">Hire me</button>
            </Link>
          </div>
        </div>
        <div className="resume__main--about">
          <span className="">Based in The Netherlands</span>
          <p>
            Since March 2022, I migrate to the Netherlands to work as a frontend
            developer.
          </p>
          <Link
            href="https://farnam.tech/uploads/Farnam_Homayounfard_Resume_a23cb7c5e9.pdf?updated_at=2022-11-16T22:48:29.282Z"
            passHref
          >
            <button className="cvButton2">Download CV</button>
          </Link>
        </div>
      </div>
    </MyLayout>
  )
}

export default Resume
