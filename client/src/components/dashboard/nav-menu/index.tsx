"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import { usePathname } from "next/navigation";

interface SubmenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface NavItemProps {
  href: string;
  icon?: React.ElementType;
  label: string;
  submenu?: SubmenuItem[];
  openSubmenu: string | null;
  handleSubmenuToggle: (label: string) => void;
  closeAllSubmenus: () => void;
  setNavOpened?: ((opened: boolean) => void) | Dispatch<SetStateAction<boolean>>;
}

export default function NavItem({
  href,
  icon: Icon,
  label,
  submenu,
  openSubmenu,
  handleSubmenuToggle,
  setNavOpened,
  closeAllSubmenus,
}: NavItemProps) {
  const pathname = usePathname();

  const activeClass =
    "bg-[#0F42C0] text-white shadow-md shadow-[#0F42C0]/20 font-semibold rounded-xl";
  const inactiveClass =
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium";

  const isSubmenuOpen = openSubmenu === label;

  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuHeight, setSubmenuHeight] = useState<number>(0);

  useEffect(() => {
    if (submenuRef.current) {
      setSubmenuHeight(isSubmenuOpen ? submenuRef.current.scrollHeight : 0);
    }
  }, [isSubmenuOpen]);

  const handleClick = () => {
    if (!submenu) closeAllSubmenus();
  };

  const isParentActive =
    pathname === href || submenu?.some((item) => pathname === item.href);

  return (
    <div className="relative w-full">
      <div
        onClick={submenu ? () => handleSubmenuToggle(label) : handleClick}
        className={`w-full flex items-center cursor-pointer transition-all duration-150 ${
          isParentActive ? activeClass : inactiveClass
        }`}
      >
        {!submenu ? (
          <Link
            href={href || "#"}
            className="flex items-center gap-3 w-full text-sm px-4 py-2.5 cursor-pointer"
            onClick={() => setNavOpened?.(false)}
          >
            {Icon && <Icon size={18} className="shrink-0" />}
            <span className="truncate">{label}</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between w-full px-4 py-2.5 cursor-pointer text-sm">
            <div className="flex items-center gap-3">
              {Icon && <Icon size={18} className="shrink-0" />}
              <span className="truncate">{label}</span>
            </div>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                isSubmenuOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Submenu Accordion */}
      {submenu && (
        <div
          ref={submenuRef}
          style={{ height: `${submenuHeight}px` }}
          className="ml-4 pl-3 border-l border-slate-200 overflow-hidden transition-[height] duration-200 ease-in-out"
        >
          <div className="flex flex-col gap-1 py-1.5">
            {submenu.map((item, index) => {
              const SubIcon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={index}
                  href={item.href || "#"}
                  onClick={() => setNavOpened?.(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors rounded-lg cursor-pointer ${
                    isActive
                      ? "text-[#0F42C0] bg-blue-50 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {SubIcon && <SubIcon size={14} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}