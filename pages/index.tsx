import dynamic from "next/dynamic"
import { MyLayout } from "../wrappers"

const Hero = dynamic(() => import("../features/Hero/Hero"))
const MyInfo = dynamic(() => import("../components/MyInfo/MyInfo"))
const TechCards = dynamic(() => import("../components/HomeComponents/Cards"))
const ContactUs = dynamic(
  () => import("../components/HomeComponents/Contact-us")
)

export default function Home() {
  return (
    <MyLayout title="Homepage" className="container flex-grow mx-auto">
      <Hero className="pt-16" />
      <MyInfo />

      <TechCards />

      <ContactUs />
    </MyLayout>
  )
}
