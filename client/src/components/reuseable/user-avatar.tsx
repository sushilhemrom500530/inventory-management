"use client";

import Image from "next/image";
import React, { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | string;
  className?: string;
  textClassName?: string;
}

export default function UserAvatar({
  src,
  name = "User",
  size = "md",
  className = "",
  textClassName = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 text-[10px]"
      : size === "lg"
      ? "w-16 h-16 text-lg"
      : size === "md"
      ? "w-10 h-10 text-xs"
      : "";

  const containerClass = className ? className : `${sizeClasses} rounded-full`;
  const resolvedTextClass = textClassName ? textClassName : "font-bold";

  const initials = (name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 ${containerClass}`}>
        <Image
          src={src}
          alt={name}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[#0F42C0] text-white select-none ${containerClass}`}
    >
      <span className={resolvedTextClass}>{initials}</span>
    </div>
  );
}

export { UserAvatar };
