import * as React from "react";
const Add = ({stroke,...props}) => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M0.5 8.83325H17.1667" stroke={stroke ?? "white"} strokeLinecap="round" />
    <path
      d="M8.83325 17.1666L8.83325 0.49996"
      stroke={stroke ?? "white"}
      strokeLinecap="round"
    />
  </svg>
);
export default Add;