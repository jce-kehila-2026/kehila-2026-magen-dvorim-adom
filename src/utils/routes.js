import { USER_ROLES } from "../services/userSchema";

export function getDashboardPathByRole(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return "/requests";
    case USER_ROLES.COORDINATOR:
      return "/requests";
    case USER_ROLES.VOLUNTEER:
      return "/volunteer-dashboard";
    default:
      return "/requests";
  }
}
