"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({ children, className, ...props }: ButtonProps) {
  // Define your perfected base styles here, including rounded-2xl
  const baseStyles =
    "bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-300";

  return (
    <button className={`${baseStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
