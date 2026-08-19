import * as React from "react";

const Inventory = ({ stroke, ...props }) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Top-left box */}
    <rect
      x={3}
      y={3}
      width={8}
      height={8}
      rx={1.5}
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 7H11"
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Top-right box */}
    <rect
      x={13}
      y={3}
      width={8}
      height={8}
      rx={1.5}
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 7H21"
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Bottom box */}
    <rect
      x={8}
      y={13}
      width={8}
      height={8}
      rx={1.5}
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 17H16"
      stroke={stroke ?? "black"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Inventory;
