import { useQuery } from "@apollo/react-hooks"
import Image from "next/image"
import { getOneArticle } from "graphql/Queries"
import { useEffect, useState } from "react"
import {
  Article,
  Article_article_data,
} from "graphql/Queries/__generated__/Article"
import { format } from "date-fns"
import styled from "styled-components"
import Round from "../../../public/RoundCube-White-Matte.svg"
import useWindowSize from "hooks/useWindowSize"
import ReactMarkdown from "markdown-to-jsx"

const GlassDiv = styled.div`
  position: relative;
  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  width: 100%;
  height: auto;
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

const url = "https://farnam.tech"

const Details: React.FC<DetailsProps> = ({ postId }) => {
  const [postData, setPostData] = useState<Article_article_data | null>(null)
  const [id, setId] = useState<string | number>(1)

  const { data, error, loading } = useQuery<Article>(getOneArticle, {
    variables: {
      id: id,
    },
  })

  const size = useWindowSize()

  useEffect(() => {
    if (data && data.article) {
      setPostData(data.article.data as Article_article_data)
    }
  }, [data, postId])

  useEffect(() => {
    if (postId) {
      setId(postId)
    }
  }, [postId])

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
                src={
                  postData.attributes?.Coverphoto?.data?.attributes?.url as any
                }
                alt={
                  postData.attributes?.Coverphoto?.data?.attributes
                    ?.alternativeText as string
                }
                loader={() => {
                  return `${url}${postData.attributes?.Coverphoto?.data?.attributes?.url}`
                }}
                layout="responsive"
                objectFit="contain"
                width={
                  postData.attributes?.Coverphoto?.data?.attributes
                    ?.width as number
                }
                height={
                  postData.attributes?.Coverphoto?.data?.attributes
                    ?.height as number
                }
              />
            </div>
            <div className="w-full">
              <h1 className="my-10 text-5xl font-extrabold text-white font-custom">
                {postData.attributes?.title}
              </h1>
              <span className="my-10 text-2xl font-bold text-white font-apparel">
                {postData.attributes?.createdAt &&
                  format(
                    new Date(postData.attributes.createdAt),
                    "yyyy-MM-dd HH:mm"
                  )}
              </span>

              <GlassDiv className="z-10 p-5 my-10 text-2xl text-white md:text-3xl font-apparel">
                {/* {postData.attributes?.description} */}

                <ReactMarkdown
                  children={postData.attributes?.description as any}
                />
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
