import { useQuery } from "@apollo/react-hooks"
import Image from "next/image"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import styled from "styled-components"
import Round from "../../../public/RoundCube-White-Matte.svg"
import { Article_article } from "../../../graphql/Queries/__generated__/Article"
import useWindowSize from "../../../hooks/useWindowSize"
import { getArticleWithID } from "../../../graphql/Queries"

const GlassDiv = styled.div`
  position: relative;

  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  width: 100%;
  height: 882px;
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 16px;

  /* border: 1px solid; */

  border-image-slice: 1;

  border-image-source: radial-gradient(
    69.43% 69.43% at 50% 50%,
    #000000 0%,
    rgb(255 255 255 / 14%) 100%
  );
`

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

  const size = useWindowSize()

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
      {error ? (
        <p>{error}</p>
      ) : loading ? (
        "loading"
      ) : (
        postData && (
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
            <div className="w-full">
              <h1 className="my-10 text-5xl font-extrabold text-white font-custom">
                {postData.title}
              </h1>
              <span className="my-10 text-2xl font-bold text-white font-apparel">
                {postData?.published_at &&
                  format(new Date(postData?.published_at), "yyyy-MM-dd HH:mm")}
              </span>

              <GlassDiv className="z-10 p-5 my-10 text-2xl text-white md:text-3xl font-apparel">
                {postData?.description}
              </GlassDiv>
              {size > 1042 && (
                <div className="relative z-0 flex items-center justify-end w-full max-w-full -top-48 ">
                  <Image src={Round} alt="Round" className="" />
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}

export default Details
