import React from "react"

interface Button
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  variant?: "black" | "white" | string
  noPaddings?: boolean
  fontSize?: string
}

const Button: React.FC<Button> = ({
  variant = "black",
  className = "",
  fontSize,
  noPaddings = false,
  disabled,
  ...rest
}) => {
  return (
    <button
      disabled={disabled}
      className={`rounded-full font-bold sm:leading-9
       ${fontSize ? fontSize : "text-lg"} ${noPaddings ? "" : "py-3 px-8"} ${
        variant === "black" ? "bg-black" : "bg-white"
      } ${variant === "black" ? "text-white" : "text-black"} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      {...rest}
    />
  )
}

export default Button
