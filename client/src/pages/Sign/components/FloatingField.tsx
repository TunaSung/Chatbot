import { forwardRef, useId, type InputHTMLAttributes } from "react";
import type { IconType } from "react-icons/lib";

interface FloatingFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  icon?: IconType; // 只用 React icon 的話可以用這個
  label: string;
  type?: string;
  className?: string;
  containerClassName?: string;
}

const FloatingField = forwardRef<HTMLInputElement, FloatingFieldProps>(
  function FloatingField(
    {
      icon: Icon,
      label,
      type = "text",
      name,
      value,
      onChange,
      autoComplete,
      required,
      minLength,
      maxLength,
      pattern,
      inputMode,
      disabled,
      id: idProp,
      className = "",
      containerClassName = "",
      ...rest
    },
    ref
  ) {
    const uid = useId();
    const id = idProp || `${name || "field"}-${uid}`;
    const labelLeft = Icon ? "left-12" : "left-3";

    return (
      <div
        className={`relative flex items-center h-12 w-full px-3 ${containerClassName}`}
      >
        {Icon && (
          <span className="text-2xl mr-2 text-gray-700">
            <Icon aria-hidden={true} />
          </span>
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          disabled={disabled}
          className={`peer flex-1 border border-slate-400 px-3 h-full rounded-xl placeholder-transparent focus:outline-none focus:border-blue-500 ${className}`}
          placeholder=" "
          ref={ref}
          {...rest}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute ${labelLeft} h-0 px-1 flex items-center  text-gray-400 transition-all duration-200
                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
                    peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:text-blue-500
                    peer-not-placeholder-shown:-top-2.5 peer-not-placeholder-shown:text-sm`}
        >
          {label}
        </label>
      </div>
    );
  }
);

export default FloatingField;
