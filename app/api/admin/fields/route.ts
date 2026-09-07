import { NextResponse } from "next/server";
import { isApiError, requireApiUser, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
  canToggleRequired,
  listFieldDefinitions,
  nextFieldOrder,
  slugifyFieldKey,
  uniqueKey,
  type FieldDefinitionView
} from "@/lib/fields";
import type { FieldDefinitionDocument, FieldType } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

function cleanOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))];
}

export async function GET() {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const db = await getDb();
  const fields = await listFieldDefinitions(db);
  return NextResponse.json({ fields });
}

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const body = await request.json().catch(() => ({}));
  const label = String(body.label || "").trim();
  const type: FieldType = body.type === "dropdown" ? "dropdown" : "text";
  const required = Boolean(body.required);
  const options = type === "dropdown" ? cleanOptions(body.options) : [];
  const copyToUser = body.copyToUser !== false;
  const filterable = body.filterable !== false;

  if (label.length < 2 || label.length > 80) {
    return NextResponse.json({ error: "Enter a field label between 2 and 80 characters." }, { status: 400 });
  }
  if (type === "dropdown" && required && !options.length) {
    return NextResponse.json({ error: "Add at least one dropdown option before making this field required." }, { status: 400 });
  }

  const db = await getDb();
  const existing = await listFieldDefinitions(db);
  const key = uniqueKey(slugifyFieldKey(label), new Set(existing.map((field) => field.key)));
  const now = new Date();
  const doc: FieldDefinitionDocument = {
    key,
    label,
    type,
    required,
    options,
    system: false,
    lockedOptions: false,
    copyToUser,
    filterable,
    order: await nextFieldOrder(db),
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection<FieldDefinitionDocument>("fieldDefinitions").insertOne(doc);
  const field: FieldDefinitionView = {
    id: result.insertedId.toHexString(),
    key: doc.key,
    label: doc.label,
    type: doc.type,
    required: doc.required,
    options: doc.options,
    system: doc.system,
    lockedOptions: doc.lockedOptions,
    copyToUser: doc.copyToUser,
    filterable: doc.filterable,
    order: doc.order
  };
  return NextResponse.json({ field });
}

export async function PATCH(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const body = await request.json().catch(() => ({}));
  const db = await getDb();
  if (Array.isArray(body.reorder)) {
    for (const item of body.reorder) {
      const itemId = safeObjectId(String(item?.id || ""));
      const order = Number(item?.order);
      if (!itemId || !Number.isFinite(order)) continue;
      await db.collection<FieldDefinitionDocument>("fieldDefinitions").updateOne(
        { _id: itemId },
        { $set: { order, updatedAt: new Date() } }
      );
    }
    const fields = await listFieldDefinitions(db);
    return NextResponse.json({ fields });
  }

  const id = safeObjectId(String(body.id || ""));
  if (!id) return NextResponse.json({ error: "Invalid field." }, { status: 400 });

  const current = await db.collection<FieldDefinitionDocument>("fieldDefinitions").findOne({ _id: id });
  if (!current) return NextResponse.json({ error: "Field not found." }, { status: 404 });

  const updates: Partial<FieldDefinitionDocument> = { updatedAt: new Date() };
  if (typeof body.label === "string") {
    const label = body.label.trim();
    if (label.length < 2 || label.length > 80) {
      return NextResponse.json({ error: "Enter a field label between 2 and 80 characters." }, { status: 400 });
    }
    updates.label = label;
  }
  if (typeof body.required === "boolean") {
    if (!canToggleRequired(current) && body.required === false) {
      return NextResponse.json({ error: "This identity field must stay required." }, { status: 400 });
    }
    updates.required = body.required;
  }
  if (!current.lockedOptions && Array.isArray(body.options)) {
    updates.options = cleanOptions(body.options);
  }
  if (!current.system && (body.type === "text" || body.type === "dropdown")) {
    updates.type = body.type;
    if (body.type === "text") updates.options = [];
  }
  if (typeof body.copyToUser === "boolean" && !current.system) updates.copyToUser = body.copyToUser;
  if (typeof body.filterable === "boolean") updates.filterable = body.filterable;
  if (typeof body.order === "number" && Number.isFinite(body.order)) updates.order = body.order;

  const nextType = updates.type || current.type;
  const nextOptions = updates.options ?? current.options;
  const nextRequired = updates.required ?? current.required;
  if (nextType === "dropdown" && nextRequired && !nextOptions.length) {
    return NextResponse.json({ error: "Add at least one dropdown option before making this field required." }, { status: 400 });
  }

  await db.collection<FieldDefinitionDocument>("fieldDefinitions").updateOne({ _id: id }, { $set: updates });
  const fields = await listFieldDefinitions(db);
  return NextResponse.json({ fields, field: fields.find((field) => field.id === id.toHexString()) });
}

export async function DELETE(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const { searchParams } = new URL(request.url);
  const id = safeObjectId(searchParams.get("id") || "");
  if (!id) return NextResponse.json({ error: "Invalid field." }, { status: 400 });

  const db = await getDb();
  const current = await db.collection<FieldDefinitionDocument>("fieldDefinitions").findOne({ _id: id });
  if (!current) return NextResponse.json({ error: "Field not found." }, { status: 404 });
  if (current.system) {
    return NextResponse.json({ error: "System fields cannot be deleted." }, { status: 400 });
  }

  await db.collection<FieldDefinitionDocument>("fieldDefinitions").deleteOne({ _id: id });
  await db.collection("participants").updateMany({}, { $unset: { [`customFields.${current.key}`]: "" } });
  await db.collection("users").updateMany({}, { $unset: { [`customFields.${current.key}`]: "" } });
  const fields = await listFieldDefinitions(db);
  return NextResponse.json({ ok: true, fields });
}
