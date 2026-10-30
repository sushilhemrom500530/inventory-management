"use client";

import React, { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { FieldError } from "react-hook-form";

export interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string | FieldError;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      wrapperClassName = "",
      type = "text",
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const errorMessage = typeof error === "string" ? error : error?.message;

    const inputElement = (
      <div className={`relative ${leftIcon || rightIcon ? "flex items-center" : ""} ${wrapperClassName}`}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F42C0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            leftIcon ? "pl-9" : ""
          } ${rightIcon ? "pr-9" : ""} ${
            errorMessage ? "border-rose-300 focus:border-rose-500 bg-rose-50/20" : ""
          } ${className}`}
          {...rest}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !errorMessage && !helperText) {
      return inputElement;
    }

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-slate-700 font-semibold text-xs">
            {label}
          </label>
        )}
        {inputElement}
        {errorMessage && <p className="text-[11px] text-rose-500 font-medium">{errorMessage}</p>}
        {helperText && !errorMessage && <p className="text-[11px] text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export { CustomInput };
export const Input = CustomInput;
export const InputField = CustomInput;
export default CustomInput;
