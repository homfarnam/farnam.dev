import * as React from "react"
import { Title } from "components"
import { MyLayout } from "wrappers"
import Round from "../../public/RoundCube-White-Matte.svg"
import Image from "next/image"
import Glasscard from "@components/Glasscard/Glasscard"

interface Blog {}

const Blog: React.FC<Blog> = () => {
  return (
    <MyLayout>
      <div className="container">
        <div className="">
          <Image
            src="/sphere.svg"
            layout="fixed"
            width={186}
            height={186}
            objectFit="cover"
            alt="sphere"
          />
        </div>
        <Title className="text-5xl text-white">The Blog </Title>
        <div className="w-full">
          <Glasscard />
        </div>
      </div>
    </MyLayout>
  )
}

export default Blog
