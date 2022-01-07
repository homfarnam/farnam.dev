import { useQuery } from "@apollo/react-hooks"
import Image from "next/image"
import { getArticleWithID } from "graphql/Queries"
import { useEffect, useState } from "react"
import { Article_article } from "graphql/Queries/__generated__/Article"
import { compareAsc, format } from "date-fns"

interface DetailsProps {
  postId: string | number
}

const url = "https://farnamh.ir"

const Details: React.FC<DetailsProps> = ({ postId }) => {
  const [postData, setPostData] = useState<Article_article | null>(null)
  const [id, setId] = useState<string | number>(1)

  const { data, error, loading } = useQuery(getArticleWithID, {
    variables: {
      id: id,
    },
  })

  useEffect(() => {
    if (data) {
      setPostData(data?.articles?.[0])
    }
  }, [data, postId])

  useEffect(() => {
    if (postId) {
      setId(postId)
    }
  }, [postId])

  useEffect(() => {
    if (postData) {
      let date = format(new Date(postData?.published_at), "yyyy-MM-dd")

      console.log("date: ", date)
    }
  }, [postData])

  return (
    <div>
      {postData && (
        <div className="w-full h-full">
          <div className="w-full h-auto">
            <Image
              src={postData.image?.url as any}
              alt={postData.image?.alternativeText as string}
              loader={() => {
                return `${url}${postData.image?.url}`
              }}
              layout="responsive"
              objectFit="contain"
              width={postData.image?.width as number}
              height={postData.image?.height as number}
            />
          </div>
          <div>
            <h1 className="my-10 text-5xl font-extrabold text-white font-custom">
              {postData.title}
            </h1>
            <span className="my-10 text-2xl font-bold text-white font-apparel">
              {postData?.published_at &&
                format(new Date(postData?.published_at), "yyyy-MM-dd HH:mm")}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Details
