import React from "react"
import { useField } from "formik"

interface TextInput {
  label?: string
  name: string
  borderRadius?: string
}

type HTMLTextInputType = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>
type Props = HTMLTextInputType & TextInput

const TextInput: React.FC<Props> = ({
  className = "",
  label,
  id,
  name,
  borderRadius = "rounded-lg",
  ...props
}) => {
  const [field, meta] = useField(name)
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label className="text-spanish-gray" htmlFor={id || name}>
          {label}
        </label>
      )}
      <input
        id={id || name}
        className={`border px-4 py-3 ${
          meta.touched && meta.error ? "border-red-500" : ""
        } ${borderRadius}`}
        {...field}
        {...props}
      />
      {meta.touched && meta.error && (
        <span className="pl-1 text-red-500">{meta.error}</span>
      )}
    </div>
  )
}

export default TextInput
