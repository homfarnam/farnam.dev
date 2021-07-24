import { MyLayout } from "wrappers"
import { Title, MyInfo } from "components"
// import Query from "queries/query"
// import getArticles from "../apollo/queries/article/articles"
// import Articles from "../components/Articles/Articles"
import loadable from "@loadable/component"
import styled from "styled-components"

const Hero = loadable(() => import("../features/Hero/Hero"))

const Card = styled.div`
  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(42px);
  width: 273px;
  padding: 15px;
  font-family: "Montserrat", "sans-serif";
  p {
    background: linear-gradient(
      113.6deg,
      #ffffff -23.37%,
      rgba(255, 255, 255, 0) 76.11%
    );
    font-family: Pilat Extended;
    font-size: 56px;
    font-style: normal;
    font-weight: 950;
    line-height: 72px;
    letter-spacing: 0em;
    text-align: left;
  }
`

export default function Home() {
  return (
    <MyLayout title="Farnam Homayounfar">
      <Hero className="pt-16" />
      {/* Blog */}
      {/* <Title className="mt-10 ml-20 sm:ml-10 font-custom">Blog</Title> */}
      <MyInfo />

      <div className="w-full flex justify-around my-10 text-2xl">
        <Card>JS</Card>
        <Card>TS</Card>
        <Card>React JS</Card>
        <Card>Next Js</Card>
      </div>
      {/* <div className="flex flex-col flex-wrap md:flex-no-wrap justify-center items-center md:flex-row"> */}
      {/* <Card className="my-10" /> */}
      {/* <Query query={getArticles}>
          {({ data: { articles } }: any) => {
            return (
              <Articles
                className="flex flex-col md:flex-row lg:justify-start  my-10 pb-10"
                articles={articles}
              />
            )
          }} 
        </Query> */}
      {/* </div> */}
    </MyLayout>
  )
}
