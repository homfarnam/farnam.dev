import ScrollContainer from "react-indiana-drag-scroll"
import Image from "next/image"
import { Articles_articles } from "../../../graphql/Queries/__generated__/Articles"
import { Button, Glasscard } from "../.."

interface CategoriesProps {
  data: Articles_articles[]
  selectedPost: (id: string | number) => void
}

const Categories: React.FC<CategoriesProps> = ({ data, selectedPost }) => {
  return (
    <ScrollContainer className="scroll-container">
      <div className="blog__cards--categories">
        {data.map((item) => {
          const myLoader = () => {
            return `https://farnamh.ir${item.image?.url}`
          }
          return (
            <div key={item.id} className="blog__cards--categories__card">
              <Glasscard className="z-0" />

              {item.image && (
                <Glasscard
                  className="relative p-5 -top-32 -right-10"
                  info={
                    <Image
                      className="rounded-3xl"
                      src={item.image?.url as any}
                      alt={item.image?.alternativeText as string}
                      layout="fill"
                      loader={myLoader}
                      onClick={() => {
                        selectedPost(item.id)
                      }}
                    />
                  }
                />
              )}

              <div
                className="blog__cards--categories__card__data"
                onClick={() => {
                  selectedPost(item.id)
                }}
              >
                <h3>{item.title}</h3>
                <Button
                  roundFull
                  className="bg-[#FFB703] font-Montserrat_Alternate font-bold rounded-lg"
                  onClick={() => {
                    selectedPost(item.id)
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
