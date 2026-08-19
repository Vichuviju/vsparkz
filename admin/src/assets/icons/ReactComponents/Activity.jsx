import * as React from "react";
const Activity = ({stroke,...props}) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 13H5.38288C5.45171 13 5.51171 12.9532 5.5284 12.8864L7.85248 3.59007C7.89048 3.43807 8.10673 3.43876 8.14376 3.59099L12.3743 20.983C12.41 21.1302 12.6165 21.1376 12.6628 20.9935L16.8233 8.04963C16.8707 7.90238 17.0829 7.91444 17.1132 8.06612L17.9759 12.3794C17.9899 12.4495 18.0515 12.5 18.123 12.5H22.5"
      stroke={stroke ?? "black"}
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  </svg>
);
export default Activity;