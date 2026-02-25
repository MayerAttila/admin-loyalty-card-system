"use client";

import React from "react";

type ButtonVariant = "brand" | "neutral";
type ButtonSize = "sm" | "md";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = ({
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg border font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60";
  const sizeClasses =
    size === "sm" ? "h-10 px-3 text-xs" : "h-11 px-4 text-sm";
  const variantClasses =
    variant === "brand"
      ? "border-brand bg-brand text-primary hover:bg-brand/80 hover:shadow-lg"
      : "border-accent-3 bg-primary text-contrast/80 hover:border-brand/60 hover:bg-brand/10 hover:text-brand hover:shadow-md";

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    />
  );
};

export default Button;
