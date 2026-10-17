/* eslint-disable react-hooks/set-state-in-effect */
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
    setNavOpened: Dispatch<SetStateAction<boolean>>;
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

    const activeClass = "button-shadow text-white";
    const inactiveClass = "text-[#B8B8B8] hover:text-primary hover:bg-primary/10 rounded-full";

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
                className={`w-full flex items-centercursor-pointer transition-all ${isParentActive ? activeClass : inactiveClass
                    }`}
            >
                {!submenu ? (
                    <Link
                        href={href || "#"}
                        className="flex items-center gap-2.5 w-full text-base px-5 py-2"
                        onClick={() => setNavOpened(false)}
                    >
                        {Icon && <Icon size={16} />}
                        <span>{label}</span>
                    </Link>
                ) : (
                    <div className="flex items-center justify-between w-full px-5 py-2 cursor-pointer">
                        <div className="flex items-center gap-2.5 text-base">
                            {Icon && <Icon size={16} />}
                            <span>{label}</span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isSubmenuOpen ? "rotate-180" : ""
                                }`}
                        />
                    </div>
                )}
            </div>

            {/* Submenu */}
            {submenu && (
                <div
                    ref={submenuRef}
                    style={{ height: `${submenuHeight}px` }}
                    className="ml-6 pl-3 overflow-hidden transition-[height] duration-300 ease-in-out"
                >
                    <div className="flex flex-col gap-1 py-2">
                        {submenu.map((item, index) => {
                            const SubIcon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={index}
                                    href={item.href || "#"}
                                    onClick={() => setNavOpened(false)}
                                    className={`flex items-center gap-2.5 px-5 py-2 rounded-s text-base transition-colors rounded-full ${isActive ? activeClass : inactiveClass
                                        }`}
                                >
                                    {SubIcon && <SubIcon size={18} />}
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