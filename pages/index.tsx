import { MyLayout } from "wrappers"
// import { Hero } from "features"
import { Title } from "components"
import Query from "queries/query"
import getArticles from "../apollo/queries/article/articles"
import Articles from "../components/Articles/Articles"
import loadable from "@loadable/component"

const Hero = loadable(() => import("../features/Hero/Hero"))

export default function Home() {
  return (
    <MyLayout title="Farnam Homayounfar">
      <Hero className="pt-5" />
      {/* Blog */}
      <Title className="mt-10">Blog</Title>

      <div className="flex flex-col flex-wrap md:flex-no-wrap justify-center items-center md:flex-row">
        {/* <Card className="my-10" /> */}
        <Query query={getArticles}>
          {({ data: { articles } }: any) => {
            return (
              <Articles
                className="flex flex-col md:flex-row my-10 pb-10"
                articles={articles}
              />
            )
          }}
        </Query>
      </div>
    </MyLayout>
  )
}
