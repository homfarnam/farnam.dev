import { MyLayout } from "wrappers"
import { Title } from "components"

export default function AboutMe() {
  return (
    <MyLayout title="Farnam Homayounfar">
      <Title className="flex justify-center py-10">About Me</Title>
      <p>
        I am Farnam Homayounfar, I'm 23 and I am a Frontend developer for 5
        years.
      </p>
      <p>
        I am experienced with Html, CSS, Sass, JavaScript, and Reactjs/React
        native, React-Redux, Next js and, MongoDB. Also, I can program with
        Python.
      </p>
      <p>I have Some knowledge in Backend like Node js and PHP and Django.</p>
      <p>
        I am an expert in Wordpress too. I have some skills in UI/UX Design.
      </p>
      <p>Also, I can work with Zepline and Adobe XD.</p>
      <p>
        In these years I learned many things with self-study, I can learn
        anything quickly.
      </p>
    </MyLayout>
  )
}
