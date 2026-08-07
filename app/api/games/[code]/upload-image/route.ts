import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Host-only: uploads an image for a question and returns its public URL. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return jsonError("Mangler billedfil.", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Billedet skal være PNG, JPEG, WEBP eller GIF.", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("Billedet er for stort (max 5 MB).", 400);
  }

  const supabase = getSupabaseServerClient();
  const extension = file.type.split("/")[1];
  const path = `${game.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("question-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) return jsonError(uploadError.message, 500);

  const { data } = supabase.storage.from("question-images").getPublicUrl(path);

  return NextResponse.json({ imageUrl: data.publicUrl });
}

export const POST = withApiErrorHandling(handlePost);
