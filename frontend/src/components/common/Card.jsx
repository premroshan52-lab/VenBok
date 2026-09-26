import React from "react";

const Card = ({
  children,
  className = "",
  header,
  title,
  subtitle,
  action,
  footer,
  interactive = false,
  elevated = false,
  style = {},
  onClick,
  ...props
}) => {
  const classes = [
    "card",
    interactive ? "card-interactive" : "",
    elevated ? "card-elevated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} onClick={onClick} {...props}>
      {(header || title || action) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
            {header}
          </div>
          {action && <div className="card-actions">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer" style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>{footer}</div>}
    </div>
  );
};

export default Card;
