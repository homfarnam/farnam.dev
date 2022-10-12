import { useEffect, useState } from "react"
import Image from "next/image"
import { Title } from "components"
import { MyLayout } from "wrappers"
import { getArticles } from "../../graphql/Queries"
import {
  Articles,
  Articles_articles,
  Articles_articles_data,
} from "graphql/Queries/__generated__/Articles"
import Categories from "@components/Blog/Categories/Categories"
import Details from "@components/Blog/Details/Details"
import { useQuery } from "@apollo/react-hooks"
import { NextPage } from "next"

interface Blog {
  data: Articles_articles_data
}

const Blog: NextPage = () => {
  const [articlesData, setArticlesData] = useState<Articles_articles_data[]>([])
  const [postId, setPostId] = useState<string | number>(1)

  const { data, error, loading } = useQuery<Articles>(getArticles)

  useEffect(() => {
    console.log({ data })
    if (data && data.articles) {
      setArticlesData(data.articles.data)
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
