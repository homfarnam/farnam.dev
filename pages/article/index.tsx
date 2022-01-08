import { useRouter } from "next/router"
import Query from "../../queries/query"
import ReactMarkdown from "react-markdown"
import Moment from "react-moment"
import ARTICLE_QUERY from "../../apollo/queries/article/article"
import { MyLayout } from "wrappers"

interface ArticleProps {}

const Article: React.FC<ArticleProps> = ({}) => {
  const router = useRouter()
  return (
    <Query query={ARTICLE_QUERY} id={router.query.id}>
      {({ data: { article } }: any) => {
        return (
          <MyLayout>
            <div className="p-20">
              <Moment format="MMM Do YYYY">{article.published_at}</Moment>
              <h1 className="my-10 text-4xl">{article.title}</h1>

              <div className="">
                <div className=" ">
                  <ReactMarkdown source={article.description} />
                  <p></p>
                </div>
              </div>
            </div>
          </MyLayout>
        )
      }}
    </Query>
  )
}

export default Article
