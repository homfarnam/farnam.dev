import ScrollContainer from "react-indiana-drag-scroll"
import Image from "next/image"
import { Button, Glasscard } from "components"
import { Articles_articles_data } from "graphql/Queries/__generated__/Articles"

interface CategoriesProps {
  data: Articles_articles_data[]
  selectedPost: (id: string | number) => void
}

const Categories: React.FC<CategoriesProps> = ({ data, selectedPost }) => {
  return (
    <ScrollContainer className="scroll-container">
      <div className="blog__cards--categories">
        {data.map((item) => {
          const myLoader = () => {
            return `https://farnam.tech${item.attributes?.Coverphoto?.data?.attributes?.url}`
          }
          return (
            <div key={item.id} className="blog__cards--categories__card">
              <Glasscard className="z-0" />
              <Glasscard className="relative p-5 -top-32 -right-10">
                <Image
                  className="rounded-3xl"
                  src={
                    item.attributes?.Coverphoto?.data?.attributes?.url as any
                  }
                  alt={
                    item.attributes?.Coverphoto?.data?.attributes
                      ?.alternativeText as any
                  }
                  layout="fill"
                  loader={myLoader}
                  onClick={() => {
                    selectedPost(item.id as string)
                  }}
                />
              </Glasscard>
              <div
                className="blog__cards--categories__card__data"
                onClick={() => {
                  selectedPost(item.id as string)
                }}
              >
                <h3>{item.attributes?.title}</h3>
                <Button
                  roundFull
                  className="bg-[#FFB703] font-Montserrat_Alternate font-bold rounded-lg"
                  onClick={() => {
                    selectedPost(item.id as string)
                  }}
                >
                  Read more
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollContainer>
  )
}

export default Categories
