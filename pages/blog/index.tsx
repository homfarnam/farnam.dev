import * as React from "react"
import { Title } from "components"
import { MyLayout } from "wrappers"

interface Blog {}

const Blog: React.FC<Blog> = () => {
  return (
    <MyLayout>
      <div>
        <Title className="flex justify-center pt-5">Blog</Title>
        <div>sdsd</div>
      </div>
    </MyLayout>
  )
}

export default Blog
