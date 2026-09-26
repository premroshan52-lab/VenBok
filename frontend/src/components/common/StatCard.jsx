import React from "react";
import MetricCard from "./MetricCard";
import { Building2, Calendar, Clock, CheckCircle2 } from "lucide-react";

const getIcon = (iconName) => {
  switch (iconName) {
    case "spaces":
      return <Building2 size={18} />;
    case "pending":
      return <Clock size={18} />;
    case "confirmed":
      return <CheckCircle2 size={18} />;
    case "bookings":
    default:
      return <Calendar size={18} />;
  }
};

const StatCard = ({ title, value, subtitle, icon = "bookings", tone = "blue", ...props }) => {
  const iconElement = typeof icon === "string" ? getIcon(icon) : icon;

  return (
    <MetricCard
      label={title}
      value={value}
      description={subtitle}
      icon={iconElement}
      {...props}
    />
  );
};

export default StatCard;
