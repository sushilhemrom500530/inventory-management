import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("refreshToken");
    cookieStore.delete("user");
    cookieStore.delete("role");
  } catch {
    // Non-fatal if cookies cannot be accessed
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("token");
  response.cookies.delete("refreshToken");
  response.cookies.delete("user");
  response.cookies.delete("role");

  return response;
}
