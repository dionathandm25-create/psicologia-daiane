export const EMAIL_ADMIN = "psi.daianedamasceno@gmail.com";

export function isAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === EMAIL_ADMIN;
}

export function getAuthenticatedPath(
  email: string | null | undefined,
  requestedPath?: string | null
) {
  const isAdmin = isAdminEmail(email);
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
