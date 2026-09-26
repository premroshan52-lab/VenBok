import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = "560px",
  style = {},
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="spacio-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="spacio-modal-container" style={{ maxWidth, ...style }}>
        <div className="spacio-modal-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="spacio-close-btn"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="spacio-modal-body">{children}</div>

        {footer && <div className="spacio-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
