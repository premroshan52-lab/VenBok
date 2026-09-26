export const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
  COORDINATOR: "coordinator",
  OWNER: "owner",
  CUSTOMER: "customer",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Campus & Super Admin",
  [ROLES.FACULTY]: "Faculty Coordinator",
  [ROLES.STUDENT]: "Student / Club Lead",
  [ROLES.COORDINATOR]: "Event Coordinator",
  [ROLES.OWNER]: "Venue Owner",
  [ROLES.CUSTOMER]: "Customer / Event Planner",
};

export const roleHomePath = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return "/dashboard/admin";
    case ROLES.OWNER:
      return "/dashboard/owner";
    case ROLES.CUSTOMER:
      return "/dashboard/customer";
    case ROLES.FACULTY:
      return "/dashboard/faculty";
    case ROLES.STUDENT:
    case ROLES.COORDINATOR:
      return "/dashboard/coordinator";
    default:
      return "/";
  }
};
