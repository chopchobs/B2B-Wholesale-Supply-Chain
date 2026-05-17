import { type NextRequest, type NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Phase 23: Auth guard + role-based route protection
export async function middleware(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * จับทุก path ยกเว้น:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - fonts/, images/ (static assets)
     * - ไฟล์ static นามสกุล svg/png/jpg/jpeg/gif/webp/ico/css/js/woff/woff2/ttf
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
