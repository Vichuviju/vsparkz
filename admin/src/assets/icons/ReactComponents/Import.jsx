import * as React from "react";
const Import = ({stroke,...props}) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M9.06104 11.3556L11.5499 13.8445L14.0388 11.3556"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.55 3.88892V13.7764"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4445 11.8417C19.4445 16.1389 16.5278 19.6195 11.6667 19.6195C6.80558 19.6195 3.88892 16.1389 3.88892 11.8417"
      stroke={stroke ?? "white"}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default Import;