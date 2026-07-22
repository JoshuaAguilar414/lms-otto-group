import { NextResponse } from "next/server";
import { getCurrentUser, isAdminRole, isFullAdmin } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export async function requireApiUser(adminOnly = false): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (adminOnly && !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export async function requireFullAdminApi(): Promise<SessionUser | NextResponse> {
  const user = await requireApiUser(true);
  if (isApiError(user)) return user;
  if (!isFullAdmin(user.role)) {
    return NextResponse.json({ error: "Only administrators can perform this action." }, { status: 403 });
  }
  return user;
}

export function isApiError(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function apiError(error: unknown, fallback = "Request failed"): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  console.error(error);
  return NextResponse.json({ error: message }, { status: 400 });
}
