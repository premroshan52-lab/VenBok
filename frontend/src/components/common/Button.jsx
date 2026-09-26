import React from "react";

const Button = ({
  children,
  className = "",
  variant = "primary", // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = "md", // 'sm' | 'md' | 'lg'
  icon = null,
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  style = {},
  ...props
}) => {
  // Backwards compatibility with legacy secondary boolean
  let finalVariant = variant;
  if (props.secondary) {
    finalVariant = "secondary";
  }

  const classes = [
    "button",
    finalVariant,
    size !== "md" ? size : "",
    loading ? "loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spacioShimmer 0.8s linear infinite",
          }}
        />
      ) : icon ? (
        <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
