import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 See Other forces the browser to follow the redirect with GET, not POST
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
