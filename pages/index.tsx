import { MyLayout } from "wrappers"
import { Hero } from "features"

export default function Home() {
  return (
    <MyLayout title="Farnam Homayounfar">
      <Hero className="pt-5" />
    </MyLayout>
  )
}
