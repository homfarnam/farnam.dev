import { useEffect, useState } from "react"
import Image from "next/image"
// import { GetStaticProps } from "next"
// import { getApolloClient } from "utils/apollo"

import { getArticles } from "../../graphql/Queries"

import { useQuery } from "@apollo/react-hooks"
import { Articles_articles } from "../../graphql/Queries/__generated__/Articles"
import { MyLayout } from "../../wrappers"
import Categories from "../../components/Blog/Categories/Categories"
import Details from "../../components/Blog/Details/Details"
import { Title } from "../../components"

interface Blog {
  data: Articles_articles[]
}

const Blog: React.FC<Blog> = () => {
  const [postId, setPostId] = useState<string | number>(1)
  const [articlesData, setArticlesData] = useState<Articles_articles[]>([])

  const { data, error, loading } = useQuery(getArticles)

  useEffect(() => {
    if (data) {
      setArticlesData(data.articles)
    }
  }, [data])

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
          {error ? (
            <p>{error}</p>
          ) : loading ? (
            "loading"
          ) : (
            articlesData.length > 0 && (
              <Categories
                data={articlesData}
                selectedPost={(id: string | number) => {
                  setPostId(id)
                }}
              />
            )
          )}

          <Details postId={postId} />
        </div>
      </div>
    </MyLayout>
  )
}

export default Blog
