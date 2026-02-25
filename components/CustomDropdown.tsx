"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type CustomDropdownOption = {
  value: string;
  label: string;
  metaLabel?: string;
};

type CustomDropdownProps = {
  value: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  menuPlacement?: "bottom" | "top";
  menuAlign?: "left" | "right";
  renderInPortal?: boolean;
  matchButtonWidth?: boolean;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
};

const CustomDropdown = ({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  menuPlacement = "bottom",
  menuAlign = "right",
  renderInPortal = false,
  matchButtonWidth = false,
  buttonClassName = "",
  menuClassName = "",
  optionClassName = "",
}: CustomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [portalPosition, setPortalPosition] = useState<{
    top: number;
    left: number;
    width: number | null;
    transform: string;
  } | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const updatePortalPosition = useCallback(() => {
    if (!renderInPortal || !open) return;
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const anchorLeft = menuAlign === "right" ? rect.right : rect.left;
    const anchorTop =
      menuPlacement === "top" ? rect.top - 8 : rect.bottom + 8;

    const transformX = menuAlign === "right" ? "translateX(-100%)" : "translateX(0)";
    const transformY = menuPlacement === "top" ? "translateY(-100%)" : "translateY(0)";
    const transform =
      transformX !== "translateX(0)" && transformY !== "translateY(0)"
        ? `${transformX} ${transformY}`
        : transformX !== "translateX(0)"
          ? transformX
          : transformY;

    setPortalPosition({
      top: anchorTop,
      left: anchorLeft,
      width: matchButtonWidth ? Math.round(rect.width) : null,
      transform,
    });
  }, [matchButtonWidth, menuAlign, menuPlacement, open, renderInPortal]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
       if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    updatePortalPosition();
  }, [updatePortalPosition]);

  useEffect(() => {
    if (!open || !renderInPortal) return;

    const handleReposition = () => {
      updatePortalPosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, renderInPortal, updatePortalPosition]);

  const menuNode = (
    <div
      ref={menuRef}
      className={`${
        renderInPortal
          ? "fixed z-[90]"
          : `absolute z-20 ${
              menuAlign === "left" ? "left-0" : "right-0"
            } ${
              menuPlacement === "top" ? "bottom-full mb-2" : "mt-2"
            }`
      } overflow-hidden rounded-xl border border-accent-3 bg-accent-1 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.7)] ${menuClassName}`}
      style={
        renderInPortal
          ? ({
              top: portalPosition?.top ?? 0,
              left: portalPosition?.left ?? 0,
              transform: portalPosition?.transform ?? "none",
              width: portalPosition?.width ?? undefined,
            } satisfies CSSProperties)
          : ({
              width:
                matchButtonWidth && buttonRef.current
                  ? buttonRef.current.offsetWidth
                  : undefined,
            } satisfies CSSProperties)
      }
    >
      <ul
        role="listbox"
        aria-label={ariaLabel}
        className="max-h-64 overflow-y-auto py-1"
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <li key={option.value} role="option" aria-selected={isSelected}>
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                disabled={disabled}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-brand/10 text-brand"
                    : "text-contrast hover:bg-primary/60"
                } ${optionClassName}`}
              >
                <span>{option.label}</span>
                {option.metaLabel ? (
                  <span className="text-[10px] text-contrast/55">
                    {option.metaLabel}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        disabled={disabled}
        className={`flex h-8 min-w-[150px] items-center justify-between gap-2 rounded-md border bg-primary/70 px-2 text-xs font-medium text-contrast outline-none transition-colors ${
          disabled
            ? "cursor-not-allowed border-accent-3 text-contrast/55 opacity-70"
            : open
              ? "border-brand"
              : "border-accent-3 hover:border-brand/60"
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="truncate">
          {selectedOption?.label ?? value}
        </span>
        <span
          className={`text-[10px] text-contrast/70 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          v
        </span>
      </button>

      {open
        ? renderInPortal && typeof document !== "undefined"
          ? createPortal(menuNode, document.body)
          : menuNode
        : null}
    </div>
  );
};

export default CustomDropdown;
