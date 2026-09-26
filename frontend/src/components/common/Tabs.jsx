import React from "react";

const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = "pill", // 'pill' | 'underline'
  className = "",
}) => {
  if (variant === "underline") {
    return (
      <div className={`spacio-tabs-underline ${className}`}>
        {tabs.map((tab) => {
          const id = typeof tab === "string" ? tab : tab.id;
          const label = typeof tab === "string" ? tab : tab.label;
          const count = tab.count;
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              className={`spacio-tab-underline ${isActive ? "active" : ""}`}
              onClick={() => onChange(id)}
            >
              <span>{label}</span>
              {count !== undefined && (
                <span
                  style={{
                    marginLeft: "6px",
                    padding: "2px 6px",
                    borderRadius: "9999px",
                    fontSize: "0.72rem",
                    backgroundColor: isActive ? "var(--primary)" : "var(--panel-overlay)",
                    color: isActive ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`spacio-tabs ${className}`}>
      {tabs.map((tab) => {
        const id = typeof tab === "string" ? tab : tab.id;
        const label = typeof tab === "string" ? tab : tab.label;
        const count = tab.count;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            className={`spacio-tab ${isActive ? "active" : ""}`}
            onClick={() => onChange(id)}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                style={{
                  marginLeft: "6px",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  fontSize: "0.7rem",
                  backgroundColor: isActive ? "var(--primary)" : "var(--panel-overlay)",
                  color: isActive ? "#fff" : "var(--text-muted)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
