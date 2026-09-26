import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

const EmptyState = ({
  icon,
  title = "No data available",
  description = "There are no records found matching your criteria.",
  actionLabel,
  onAction,
  className = "",
  style = {},
}) => {
  return (
    <div className={`spacio-empty-state ${className}`} style={style}>
      <div className="spacio-empty-icon">{icon || <Inbox size={24} />}</div>
      <h4 className="spacio-empty-title">{title}</h4>
      <p className="spacio-empty-desc">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
