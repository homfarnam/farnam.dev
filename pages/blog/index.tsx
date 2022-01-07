import { useEffect } from "react"
import Image from "next/image"
import ScrollContainer from "react-indiana-drag-scroll"
import { GetStaticProps } from "next"
import { getApolloClient } from "utils/apollo"
import { Button, Title, Glasscard } from "components"
import { MyLayout } from "wrappers"
import { getArticles } from "../../graphql/Queries"
import { Articles_articles } from "graphql/Queries/__generated__/Articles"
import Categories from "@components/Blog/Categories/Categories"

interface Blog {
  data: Articles_articles[]
}

const Blog: React.FC<Blog> = ({ data }) => {
  useEffect(() => {
    console.log("data: ", data)
  }, [data])

  return (
    <MyLayout>
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
          <Categories data={data} />
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
