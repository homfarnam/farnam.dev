import { useEffect, useState } from "react"
import Image from "next/image"
import { GetStaticProps } from "next"
import { getApolloClient } from "utils/apollo"
import { Title } from "components"
import { MyLayout } from "wrappers"
import { getArticles } from "../../graphql/Queries"
import { Articles_articles } from "graphql/Queries/__generated__/Articles"
import Categories from "@components/Blog/Categories/Categories"
import Details from "@components/Blog/Details/Details"

interface Blog {
  data: Articles_articles[]
}

const Blog: React.FC<Blog> = ({ data }) => {
  const [postId, setPostId] = useState<string | number>(1)

  useEffect(() => {
    console.log("postId: ", postId)
  }, [postId])

  return (
    <MyLayout className="container flex-grow mx-auto" title="blog">
      <div className="container blog">
        <div className="blog__circle">
          <Image
            src="/sphere.svg"
            layout="fixed"
            width={186}
            height={186}
            objectFit="cover"
            alt="sphere"
          />
        </div>
        <div className="blog__cards">
          <Title className="text-5xl text-white">The Blog </Title>
          <Categories
            data={data}
            selectedPost={(id: string | number) => {
              setPostId(id)
            }}
          />
          <Details postId={postId} />
        </div>
      </div>
    </MyLayout>
  )
}

export default Blog

export const getStaticProps: GetStaticProps = async () => {
  const apolloClient = getApolloClient({})

  const {
    data: { articles },
  } = await apolloClient.query({
    query: getArticles,
  })

  return {
    props: {
      data: articles,
    },
  }
}
