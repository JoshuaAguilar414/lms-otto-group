import { NextResponse } from "next/server";
import { storageHealth } from "@/lib/course-storage";
import { getDb } from "@/lib/db";

export async function GET() {
  const storage = await storageHealth();

  try {
    await (await getDb()).command({ ping: 1 });
    return NextResponse.json({
      status: "ok",
      database: "connected",
      storageBackend: storage.backend,
      storageOk: storage.ok,
      storageDetail: storage.detail,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
        storageBackend: storage.backend,
        storageOk: storage.ok,
        storageDetail: storage.detail
      },
      { status: 503 }
    );
  }
}
