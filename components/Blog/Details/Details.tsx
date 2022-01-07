import { useQuery } from "@apollo/react-hooks"
import { getArticle } from "graphql/Queries"
import { useEffect } from "react"

interface DetailsProps {
  postId: string | number
}

const Details: React.FC<DetailsProps> = ({ postId }) => {
  const { data, error, loading } = useQuery(getArticle, {
    variables: {
      id: postId,
    },
  })

  useEffect(() => {
    console.log("data: ", { postId, data })
  }, [data, postId])
  return (
    <div>
      {data && (
        <div>
          <div></div>
        </div>
      )}
    </div>
  )
}

export default Details
