import ScrollContainer from "react-indiana-drag-scroll"
import Image from "next/image"
import { Button, Title, Glasscard } from "components"
import { Articles_articles } from "graphql/Queries/__generated__/Articles"

interface CategoriesProps {
  data: Articles_articles[]
}

const Categories: React.FC<CategoriesProps> = ({ data }) => {
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
              <Glasscard className="relative p-5 -top-32 -right-10">
                {item.image && (
                  <Image
                    className="rounded-3xl"
                    src={item.image?.url as any}
                    alt={item.image?.alternativeText as any}
                    layout="fill"
                    loader={myLoader}
                    // width={item.image?.width as any}
                    // height={item.image?.height as any}
                  />
                )}
              </Glasscard>
              <div className="blog__cards--categories__card__data">
                <h3>{item.title}</h3>
                <Button
                  roundFull
                  className="bg-[#FFB703] font-Montserrat_Alternate font-bold rounded-lg"
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
