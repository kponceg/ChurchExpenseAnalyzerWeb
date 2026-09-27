import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const { locale } = await request.json();
  if (locale !== "en" && locale !== "es") return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  const response = NextResponse.json({ locale });
  response.cookies.set("church-locale", locale, { maxAge: 31_536_000, path: "/", sameSite: "lax" });
  return response;
}
