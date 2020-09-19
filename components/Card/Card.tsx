import Button from "components/Button"
import * as React from "react"
import Link from "next/link"

interface CardProps {
  className?: string
  article?: any
}

const Card: React.FC<CardProps> = ({ className, article }) => {
  return (
    <>
      <div
        className={`border-gray-900 border-2 flex flex-col p-5 w-10/12  md:w-1/3 h-11/12 rounded-lg justify-between items-start  px-8 mr-5 bg-indigo-100 ${className}`}
      >
        <Link href={{ pathname: "article", query: { id: article?.id } }}>
          <a>
            <h3 className="my-5 text-3xl">{article?.title}</h3>
          </a>
        </Link>
        <p>{article.description}</p>
        <Link href={{ pathname: "article", query: { id: article?.id } }}>
          <a>
            <Button className="ml-auto text-xs w-full mt-5">Read More</Button>
          </a>
        </Link>
      </div>

      {/* <Link href={{ pathname: "/article", query: { id: article.id } }}> */}
      {/* <a> */}
      {/* <div>
        <div>
          <p id="category">{article.category.name}</p>
          <p id="title" className="uk-text-large">
            {article.title}
          </p>
          <p id="description">{article.description}</p>
        </div>
      </div> */}
      {/* </a> */}
      {/* </Link> */}
    </>
  )
}

export default Card
