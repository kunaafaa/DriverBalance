"use client";

import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: "light" | "dark";
}

export default function Logo({ className = "", iconOnly = false, variant = "light" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-[#0D0D0D]";
  const iconColor = "#A855F7"; // Brand Purple

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg
          viewBox="0 0 120 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Stylized 'D' - White Part */}
          <path
            d="M10 10V70H30C50 70 65 55 65 40C65 25 50 10 30 10H10ZM25 25H30C40 25 50 32 50 40C50 48 40 55 30 55H25V25Z"
            fill={variant === "light" ? "white" : "#0D0D0D"}
          />
          {/* Slanted Purple Bars */}
          <path d="M45 10L30 70H45L60 10H45Z" fill={iconColor} />
          <path d="M65 10L50 70H65L80 10H65Z" fill={iconColor} />
          <path d="M85 10L70 70H85L100 10H85Z" fill={iconColor} />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`text-xl font-black tracking-tighter leading-none ${textColor}`}>
            DriverBalance
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${variant === "light" ? "text-gray-400" : "text-gray-500"}`}>
            DriverMade CRM
          </span>
        </div>
      )}
    </div>
  );
}
