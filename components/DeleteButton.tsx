"use client";

import React, { useState } from "react";
import { FaTrash, FaXmark } from "react-icons/fa6";

type DeleteButtonProps = {
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
};

const DeleteButton = ({
  onConfirm,
  onCancel,
  disabled = false,
  title,
  ariaLabel,
  className = "",
}: DeleteButtonProps) => {
  const [armed, setArmed] = useState(false);
  const label = "Delete";

  const triggerClasses = `inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-transform duration-200 disabled:cursor-not-allowed disabled:opacity-60 border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 ${
    armed ? "scale-[1.06]" : "scale-100"
  } ${className}`;
  const cancelClasses = `inline-flex items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition-all duration-200 border-contrast/40 bg-contrast/5 text-contrast hover:bg-contrast/10 ${
    armed ? "w-8 h-8 opacity-100 ml-1" : "w-0 h-0 opacity-0 ml-0 pointer-events-none"
  }`;

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!armed) {
            setArmed(true);
            return;
          }
          onConfirm?.();
          setArmed(false);
        }}
        disabled={disabled}
        title={title ?? label}
        aria-label={ariaLabel ?? label}
        className={triggerClasses}
      >
        <FaTrash className="text-sm" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setArmed(false);
          onCancel?.();
        }}
        aria-label="Cancel delete"
        title="Cancel"
        className={cancelClasses}
      >
        <FaXmark className="text-sm" />
      </button>
    </div>
  );
};

export default DeleteButton;
