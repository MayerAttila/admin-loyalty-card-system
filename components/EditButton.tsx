"use client";

import React from "react";
import { FaPen } from "react-icons/fa6";

type EditButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
};

const EditButton = ({
  onClick,
  disabled = false,
  title,
  ariaLabel,
  className = "",
}: EditButtonProps) => {
  const label = "Edit";
  const triggerClasses = `inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-transform duration-200 disabled:cursor-not-allowed disabled:opacity-60 border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 ${className}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={ariaLabel ?? label}
      className={triggerClasses}
    >
      <FaPen className="text-sm" />
    </button>
  );
};

export default EditButton;
