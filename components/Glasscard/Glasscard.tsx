import { HTMLAttributes } from "react"
import styled from "styled-components"

const GlassDiv = styled.div`
  position: relative;

  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  width: 320px;
  height: 157px;
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 16px;

  /* border: 1px solid; */

  border-image-slice: 1;

  border-image-source: radial-gradient(
    69.43% 69.43% at 50% 50%,
    #000000 0%,
    rgb(255 255 255 / 14%) 100%
  );
`

interface GlasscardProps {
  className?: HTMLAttributes<HTMLDivElement>["className"]
  children?: React.ReactNode
}

const Glasscard: React.FC<GlasscardProps> = ({ className, children }) => {
  return <GlassDiv className={className}>{children}</GlassDiv>
}

export default Glasscard
