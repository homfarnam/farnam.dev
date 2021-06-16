import * as React from "react"
import styled from "styled-components"

const Mydiv = styled.div`
  position: absolute;
  width: 920px;
  height: 448px;

  background: linear-gradient(
    152.97deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  backdrop-filter: blur(42px);
  /* Note: backdrop-filter has minimal browser support */

  border-radius: 16px;
`

interface MeProps {}

const MyInfo: React.FC<MeProps> = () => {
  return (
    <div>
      <Mydiv></Mydiv>
    </div>
  )
}

export default MyInfo
