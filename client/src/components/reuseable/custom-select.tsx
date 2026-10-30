"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: any; name?: string }; currentTarget: { value: any; name?: string } }) => void;
  onValueChange?: (value: any) => void;
  options?: CustomSelectOption[];
  children?: ReactNode;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export default function CustomSelect({
  value,
  defaultValue,
  onChange,
  onValueChange,
  options,
  children,
  placeholder = "Select an option",
  className = "",
  wrapperClassName = "",
  disabled = false,
  name,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | number>(
    value !== undefined ? value : defaultValue !== undefined ? defaultValue : ""
  );
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [maxHeight, setMaxHeight] = useState<number>(240);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync internal value if controlled
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Extract options from props.options or children (<option>)
  const parsedOptions = useMemo<CustomSelectOption[]>(() => {
    if (options && options.length > 0) {
      return options;
    }

    const extracted: CustomSelectOption[] = [];
    const extractFromNode = (node: ReactNode) => {
      if (!node) return;
      React.Children.forEach(node, (child) => {
        if (!React.isValidElement(child)) return;

        if (child.type === React.Fragment) {
          extractFromNode((child.props as any)?.children);
          return;
        }

        const childProps = child.props as any;
        if (childProps) {
          const optVal = childProps.value !== undefined ? childProps.value : childProps.children;
          const optLbl = childProps.children !== undefined ? childProps.children : childProps.value;
          extracted.push({
            value: optVal,
            label: optLbl,
            disabled: Boolean(childProps.disabled),
          });
        }
      });
    };

    extractFromNode(children);
    return extracted;
  }, [options, children]);

  // Find currently active option
  const selectedOption = useMemo(() => {
    return parsedOptions.find((opt) => String(opt.value) === String(internalValue));
  }, [parsedOptions, internalValue]);

  // Smart Y-axis placement calculation
  const updatePlacement = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const preferredHeight = 240;
    const buffer = 10;

    // Flip to top if bottom space is constrained and top space is larger
    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      setPlacement("top");
      const available = Math.max(120, spaceAbove - buffer);
      setMaxHeight(Math.min(preferredHeight, available));
    } else {
      setPlacement("bottom");
      const available = Math.max(120, spaceBelow - buffer);
      setMaxHeight(Math.min(preferredHeight, available));
    }
  }, []);

  // Update placement when opened or scrolled/resized
  useEffect(() => {
    if (!isOpen) return;

    updatePlacement();

    const handleScrollOrResize = () => {
      updatePlacement();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePlacement]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-select-option]");
      const targetItem = items[highlightedIndex] as HTMLElement;
      if (targetItem) {
        targetItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleSelect = (opt: CustomSelectOption) => {
    if (opt.disabled) return;

    setInternalValue(opt.value);
    setIsOpen(false);

    if (onValueChange) {
      onValueChange(opt.value);
    }

    if (onChange) {
      onChange({
        target: { value: opt.value, name },
        currentTarget: { value: opt.value, name },
      });
    }

    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = parsedOptions.findIndex(
          (opt) => String(opt.value) === String(internalValue)
        );
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < parsedOptions.length && parsedOptions[next].disabled) {
            next++;
          }
          return next < parsedOptions.length ? next : prev;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let prevIdx = prev - 1;
          while (prevIdx >= 0 && parsedOptions[prevIdx].disabled) {
            prevIdx--;
          }
          return prevIdx >= 0 ? prevIdx : prev;
        });
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < parsedOptions.length) {
          handleSelect(parsedOptions[highlightedIndex]);
        }
        break;
      }
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full ${isOpen ? "z-40" : "z-10"} ${wrapperClassName}`}
    >
      {/* Hidden input for standard forms */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={internalValue}
          disabled={disabled}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              const currentIndex = parsedOptions.findIndex(
                (opt) => String(opt.value) === String(internalValue)
              );
              setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-150 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "ring-2 ring-[#0F42C0]/20 border-[#0F42C0] bg-white" : ""
        } ${className}`}
      >
        <span className="truncate flex-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0F42C0]" : "text-slate-400 group-hover:text-slate-600"
          }`}
        />
      </button>

      {/* Dropdown Menu with Smart Y-Axis Placement */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          style={{ maxHeight: `${maxHeight}px` }}
          className={`absolute left-0 right-0 w-full min-w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-y-auto py-1 z-50 text-xs transition-all duration-150 animate-in fade-in-50 ${
            placement === "top"
              ? "bottom-full mb-1.5 origin-bottom"
              : "top-full mt-1.5 origin-top"
          }`}
        >
          {parsedOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-slate-400 text-center italic">
              No options available
            </div>
          ) : (
            parsedOptions.map((opt, index) => {
              const isSelected = String(opt.value) === String(internalValue);
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={`${opt.value}-${index}`}
                  data-select-option
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => {
                    if (!opt.disabled) setHighlightedIndex(index);
                  }}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2 transition-colors cursor-pointer select-none ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : isSelected
                      ? "bg-blue-50/80 text-[#0F42C0] font-semibold"
                      : isHighlighted
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate flex-1">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#0F42C0]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
