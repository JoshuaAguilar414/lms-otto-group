import { NextResponse } from "next/server";

/**
 * Mindsmith SCORM wrappers request /api/scorm/launch on the page origin.
 * The real player lives on Mindsmith — redirect there with the same query string.
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL("https://app.mindsmith.ai/api/scorm/launch");
  target.search = incoming.search;
  return NextResponse.redirect(target, 302);
}
