import dynamic from "next/dynamic"
import { MyInfo } from "../components"
import TechCards from "../components/HomeComponents/Cards"
import ContactUs from "../components/HomeComponents/Contact-us"
import { MyLayout } from "../wrappers"

const Hero = dynamic(() => import("../features/Hero/Hero"))

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
