export type AuthenticatedUser = {
  app_metadata?: object | null;
} | null | undefined;

export function isAdminUser(user: AuthenticatedUser) {
  const metadata = user?.app_metadata;
  return metadata !== null &&
    metadata !== undefined &&
    "role" in metadata &&
    metadata.role === "admin";
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
