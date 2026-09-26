import React from "react";

const StatusBadge = ({ status = "Pending", size = "md", style = {} }) => {
  const text = String(status || "Pending");
  const slug = text.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Determine semantic status class
  let statusClass = "badge-warning";
  if (["approved", "confirmed", "active", "resolved", "completed"].includes(slug)) {
    statusClass = "badge-success";
  } else if (["rejected", "cancelled", "disputed"].includes(slug)) {
    statusClass = "badge-danger";
  } else if (["in-progress", "academic"].includes(slug)) {
    statusClass = "badge-info";
  } else if (["draft", "inactive"].includes(slug)) {
    statusClass = "badge-neutral";
  }

  return (
    <span
      className={`badge ${statusClass} status-${slug}`}
      style={{
        fontSize: size === "sm" ? "0.7rem" : "0.76rem",
        padding: size === "sm" ? "2px 7px" : "3px 9px",
        ...style,
      }}
    >
      <span className="badge-dot" />
      {text}
    </span>
  );
};

export default StatusBadge;
