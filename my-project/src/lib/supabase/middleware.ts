import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Phase 23: Role ที่อนุญาตให้เข้า /merchant และ /onboarding
const MERCHANT_ROLES: ReadonlyArray<string> = ["MERCHANT", "ADMIN"];

// API routes ที่เป็น public (ไม่ต้อง auth)
const PUBLIC_API_PREFIXES: ReadonlyArray<string> = ["/api/notifications"];

// หน้า public อื่นๆ ที่ middleware ไม่ต้องบังคับ auth
const PUBLIC_PATHS: ReadonlyArray<string> = ["/"];

interface RouteContext {
  pathname: string;
  isMerchantArea: boolean;
  isOnboarding: boolean;
  isStorefront: boolean;
  isAuthPage: boolean;
  isApi: boolean;
  isPublicApi: boolean;
  isPublicPage: boolean;
}

function analyzeRoute(pathname: string): RouteContext {
  const isMerchantArea = pathname === "/merchant" || pathname.startsWith("/merchant/");
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isStorefront = pathname.startsWith("/storefront");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  return {
    pathname,
    isMerchantArea,
    isOnboarding,
    isStorefront,
    isAuthPage,
    isApi,
    isPublicApi,
    isPublicPage,
  };
}

// helper: redirect destination ตาม role
function defaultHomeForRole(role: string | null): string {
  if (role && MERCHANT_ROLES.includes(role)) {
    return "/merchant";
  }
  return "/storefront/products";
}

// helper: สร้าง JSON 401 สำหรับ API
function unauthorizedJson(): NextResponse {
  return NextResponse.json(
    { data: null, error: "Unauthorized" },
    { status: 401 }
  );
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const route = analyzeRoute(pathname);

  // เตรียม response สำหรับ refresh cookie (Supabase SSR requirement)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ดึง user + refresh session cookie
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[middleware] supabase.auth.getUser failed:", err);
    userId = null;
  }

  // Public API → ปล่อยผ่าน (ไม่ต้อง auth)
  if (route.isPublicApi) {
    return supabaseResponse;
  }

  // API ที่ไม่ public → ต้อง auth
  if (route.isApi) {
    if (!userId) {
      return unauthorizedJson();
    }
    return supabaseResponse;
  }

  // หน้า landing / public → ปล่อยผ่านโดยไม่ตรวจ role
  if (route.isPublicPage) {
    return supabaseResponse;
  }

  // ผู้ใช้ยังไม่ login
  if (!userId) {
    // หน้า login/register เปิดให้เข้าได้
    if (route.isAuthPage) {
      return supabaseResponse;
    }

    // protected route → redirect ไป /login พร้อม redirectTo
    if (route.isMerchantArea || route.isOnboarding || route.isStorefront) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // route อื่นๆ → public by default
    return supabaseResponse;
  }

  // ผู้ใช้ login แล้ว → ดึง role
  // Note: ใช้ Supabase JS client (fetch-based) ซึ่ง Edge runtime รองรับ
  // ห้ามใช้ Prisma ใน middleware เพราะรันบน Edge ไม่ได้
  let role: string | null = null;
  try {
    const { data: userRecord, error } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single<{ role: string }>();

    if (error) {
      console.error("[middleware] role lookup error:", error.message);
    } else {
      role = userRecord?.role ?? null;
    }
  } catch (err) {
    console.error("[middleware] role lookup exception:", err);
    role = null;
  }

  const isMerchant = role !== null && MERCHANT_ROLES.includes(role);

  // login/register แต่ login อยู่แล้ว → redirect ไปหน้า home ตาม role
  if (route.isAuthPage) {
    return NextResponse.redirect(new URL(defaultHomeForRole(role), request.url));
  }

  // /merchant/** → ต้องเป็น MERCHANT/ADMIN
  if (route.isMerchantArea) {
    if (role === null) {
      // role lookup ล้มเหลว → fail closed
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!isMerchant) {
      return NextResponse.redirect(new URL("/storefront/products", request.url));
    }
    return supabaseResponse;
  }

  // /onboarding → ต้องเป็น MERCHANT/ADMIN
  if (route.isOnboarding) {
    if (role === null) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!isMerchant) {
      return NextResponse.redirect(new URL("/storefront/products", request.url));
    }
    return supabaseResponse;
  }

  // /storefront/** → แค่ login ก็พอ (role อะไรก็ได้)
  if (route.isStorefront) {
    return supabaseResponse;
  }

  // อื่นๆ → public by default
  return supabaseResponse;
}
