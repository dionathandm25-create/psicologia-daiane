const DAIANE_ADMIN_USER_ID = "6a1c19ea-16ef-434d-9f38-e2ea5f4c7f69";
const DAIANE_ADMIN_EMAIL = "psi.daianedamasceno@gmail.com";

export type AuthenticatedUser = {
  id?: string;
  email?: string | null;
  app_metadata?: object | null;
} | null | undefined;

export function isAdminUser(user: AuthenticatedUser) {
  const metadata = user?.app_metadata;
  const hasAdminRole = metadata !== null &&
    metadata !== undefined &&
    "role" in metadata &&
    metadata.role === "admin";
  const isDaianeAdmin =
    user?.id === DAIANE_ADMIN_USER_ID &&
    user.email?.trim().toLowerCase() === DAIANE_ADMIN_EMAIL;

  return hasAdminRole || isDaianeAdmin;
}

export function getAuthenticatedPath(
  user: AuthenticatedUser,
  requestedPath?: string | null
) {
  const isAdmin = isAdminUser(user);
  const homePath = isAdmin ? "/admin" : "/paciente";

  if (!requestedPath) {
    return homePath;
  }

  try {
    const target = new URL(requestedPath, "https://app.internal");

    if (target.origin !== "https://app.internal") {
      return homePath;
    }

    const isAllowedPath = isAdmin
      ? target.pathname === "/admin" ||
        target.pathname.startsWith("/admin/") ||
        target.pathname === "/atendimento" ||
        target.pathname.startsWith("/atendimento/")
      : target.pathname === "/paciente" ||
        target.pathname.startsWith("/paciente/");

    return isAllowedPath
      ? `${target.pathname}${target.search}`
      : homePath;
  } catch {
    return homePath;
  }
}
