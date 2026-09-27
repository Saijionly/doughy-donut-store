import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options as CookieOptions
              );
            }
          );
        },
      },
    }
  );

  /*
   * Validate the current user against
   * Supabase Auth.
   *
   * Don't replace this with getSession()
   * for server-side authorization.
   */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  /*
   * =====================================
   * ADMIN LOGIN
   * =====================================
   *
   * Login must remain publicly reachable.
   */
  if (pathname === "/admin/login") {
    return response;
  }

  /*
   * =====================================
   * PROTECTED ADMIN ROUTES
   * =====================================
   */
  if (pathname.startsWith("/admin")) {
    if (userError || !user) {
      const url =
        request.nextUrl.clone();

      url.pathname = "/admin/login";

      return NextResponse.redirect(
        url
      );
    }

    /*
     * Check whether authenticated user
     * belongs to admin_users.
     *
     * The RLS policy only allows users
     * to read their own membership.
     */
    const {
      data: adminUser,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      adminError ||
      !adminUser
    ) {
      /*
       * The client-side AdminLayout will
       * also sign out unauthorized users.
       *
       * Proxy immediately prevents them
       * from entering the protected page.
       */
      const url =
        request.nextUrl.clone();

      url.pathname =
        "/admin/login";

      return NextResponse.redirect(
        url
      );
    }
  }

  return response;
}