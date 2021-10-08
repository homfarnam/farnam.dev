import { MyLayout } from "wrappers"
import { MyInfo } from "components"
import dynamic from "next/dynamic"

import TechCards from "@components/HomeComponents/Cards"
import ContactUs from "@components/HomeComponents/Contact-us"

const Hero = dynamic(() => import("../features/Hero/Hero"))

export default function Home() {
  return (
    <MyLayout title="Homepage">
      <Hero className="pt-16" />
      {/* Blog */}
      <MyInfo />

      <TechCards />

      <ContactUs />
    </MyLayout>
  )
}
