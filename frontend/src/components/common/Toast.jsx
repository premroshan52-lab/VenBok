import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg) => addToast(msg, "error"), [addToast]);
  const warning = useCallback((msg) => addToast(msg, "warning"), [addToast]);
  const info = useCallback((msg) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          let icon = <CheckCircle2 size={18} color="#34d399" />;
          let borderColor = "var(--success-border)";
          let bgColor = "rgba(17, 19, 24, 0.95)";

          if (toast.type === "error") {
            icon = <AlertCircle size={18} color="#f87171" />;
            borderColor = "var(--danger-border)";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle size={18} color="#fbbf24" />;
            borderColor = "var(--warning-border)";
          } else if (toast.type === "info") {
            icon = <Info size={18} color="#60a5fa" />;
            borderColor = "var(--info-border)";
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: bgColor,
                backdropFilter: "blur(12px)",
                border: `1px solid ${borderColor}`,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
                color: "var(--text)",
                fontSize: "0.86rem",
                fontWeight: 500,
                minWidth: "280px",
                maxWidth: "420px",
                animation: "spacioScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (msg) => console.log("Toast [Success]:", msg),
      error: (msg) => console.error("Toast [Error]:", msg),
      warning: (msg) => console.warn("Toast [Warning]:", msg),
      info: (msg) => console.log("Toast [Info]:", msg),
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return ctx;
};
