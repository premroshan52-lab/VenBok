import React, { useEffect } from "react";
import { X } from "lucide-react";

const Drawer = ({
  isOpen = true,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "480px",
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="spacio-drawer-backdrop" onClick={onClose} />
      <div className="spacio-drawer" style={{ maxWidth: width }}>
        <div className="spacio-modal-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="spacio-close-btn" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="spacio-modal-body" style={{ overflowY: "auto" }}>
          {children}
        </div>

        {footer && <div className="spacio-modal-footer">{footer}</div>}
      </div>
    </>
  );
};

export default Drawer;
