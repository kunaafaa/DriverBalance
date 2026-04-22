export { auth as proxy } from "@/auth";

export const config = {
  // Protect all routes but explicitly exclude internal Next.js assets and the auth API
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
