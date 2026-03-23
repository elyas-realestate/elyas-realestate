const fs = require('fs');
const path = require('path');

const content = [
'import { NextResponse } from "next/server";',
'import type { NextRequest } from "next/server";',
'import { createClient } from "@supabase/supabase-js";',
'',
'export async function middleware(request: NextRequest) {',
'  const supabase = createClient(',
'    process.env.NEXT_PUBLIC_SUPABASE_URL!,',
'    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!',
'  );',
'',
'  const token = request.cookies.get("sb-apmdwautyqoqjlabxysz-auth-token");',
'',
'  if (request.nextUrl.pathname.startsWith("/dashboard") && !token) {',
'    return NextResponse.redirect(new URL("/login", request.url));',
'  }',
'',
'  return NextResponse.next();',
'}',
'',
'export const config = {',
'  matcher: ["/dashboard/:path*"],',
'};',
].join('\n');

fs.writeFileSync(path.join(__dirname, 'middleware.ts'), content, 'utf8');
console.log('Done!');