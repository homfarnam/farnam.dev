import styled from "styled-components"

const BackText = styled.p`
  position: absolute;
  width: 1532.25px;
  height: 596px;
  right: 389px;
  top: 50px;
  font-style: normal;
  font-weight: bold;
  font-size: 497.104px;
  line-height: 597px;
  text-align: center;
  z-index: 0;
  color: #f2f7f6;
  mix-blend-mode: multiply;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
`
const GreenBox = styled.div`
  position: absolute;
  width: 441px;
  height: 332px;
  right: 186px;
  z-index: 0;
  bottom: 200px;
  background: #31c3a5;
  background-blend-mode: overlay;
  mix-blend-mode: normal;
`

const MyPic = styled.img`
  position: relative;
  width: 601px;
  height: 527px;
  top: calc(50% - 527px / 2.8);
  mix-blend-mode: normal;
  z-index: 10;
  display: flex;
  /* box-shadow: 10px 10px 5px white; */
  padding: 9px;
  box-shadow: inset 10px 10px 50px #3d8eb969;
  -moz-box-shadow: 10px 10px 5px #3d8eb969;
  -webkit-box-shadow: 10px 10px 5px #3d8eb969;
  -khtml-box-shadow: 10px 10px 5px #3d8eb969;
  @media (min-width: 1024px) {
    left: 178px;
    right: 206px;
    padding: 0px;
  }
`

const Bio = styled.div`
  font-size: 24px;
  line-height: 32px;
  font-weight: 400;
`

const MyTitle = styled.h1`
  /* font-family: "Pacifico", cursive; */
  /* width: 486px; */
  text-align: left;
  text-transform: capitalize;
  font-style: normal;
  line-height: 40px;
`

export { BackText, Bio, GreenBox, MyPic, MyTitle }
