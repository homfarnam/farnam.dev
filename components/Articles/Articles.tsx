import Card from "components/Card"
import * as React from "react"

interface ArticlesProps {
  articles: any
  className?: string
}

const Articles: React.FC<ArticlesProps> = ({ articles, className }) => {
  const myArticles = articles.slice(0, articles.length)

  return (
    <div className={`${className}`}>
      {myArticles.map(
        (article: { id: number; name: string; description: string }) => {
          return <Card article={article} key={article.id} />
        }
      )}
    </div>
  )
}

export default Articles
