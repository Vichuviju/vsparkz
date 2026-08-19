import { useEffect, useState } from "react";

export default function MinimalSwitch({
  defaultOn = false,
  checked,
  onChange,
  disabled = false,
}) {
  const isControlled = typeof checked === "boolean";
  const [internalOn, setInternalOn] = useState(defaultOn);
  const on = isControlled ? checked : internalOn;

  useEffect(() => {
    if (!isControlled) setInternalOn(defaultOn);
  }, [defaultOn, isControlled]);

  const toggle = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternalOn(next);
    onChange && onChange(next);
  };

  return (
    <div
      onClick={toggle}
      aria-disabled={disabled}
      style={{
        width: 36,
        height: 20,
        background: on ? "#2563eb" : "#d1d5db",
        borderRadius: 999,
        padding: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          background: "white",
          borderRadius: "50%",
          transform: `translateX(${on ? 16 : 0}px)`,
          transition: "transform 0.2s"
        }}
      />
    </div>
  );
}
