import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthenticatedPath,
  isAdminEmail,
} from "@/lib/auth/redirects";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, user, copyCookies } =
    await updateSession(request);
  const pathname = request.nextUrl.pathname;

  function redirect(destination: string) {
    const redirectResponse = NextResponse.redirect(
      new URL(destination, request.url)
    );
    copyCookies(redirectResponse);
    return redirectResponse;
  }

  if (pathname === "/login") {
    if (user) {
      const destination = getAuthenticatedPath(
        user.email,
        request.nextUrl.searchParams.get("next")
      );
      return redirect(destination);
    }

    return response;
  }

  if (pathname === "/") {
    const destination = user
      ? getAuthenticatedPath(user.email)
      : "/login";
    return redirect(destination);
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(redirectResponse);
    return redirectResponse;
  }

  const isAdministrativeRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/atendimento" ||
    pathname.startsWith("/atendimento/");
  if (isAdministrativeRoute && !isAdminEmail(user.email)) {
    return redirect("/paciente");
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/paciente", "/atendimento/:path*"],
};
