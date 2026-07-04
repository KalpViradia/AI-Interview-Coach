import React from "react";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Shimmer({ className, ...props }: ShimmerProps) {
  return (
    <div
      className={`bg-zinc-800 animate-pulse rounded-md ${className || ""}`}
      {...props}
    />
  );
}
