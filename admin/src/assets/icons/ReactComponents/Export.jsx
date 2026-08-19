import * as React from "react";
const Export = ({stroke,...props}) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9.06104 6.31946L11.5499 3.83057L14.0388 6.31946"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.55 13.7861V3.89856"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.88892 11.6666C3.88892 15.9638 6.80558 19.4444 11.6667 19.4444C16.5278 19.4444 19.4445 15.9638 19.4445 11.6666"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default Export;