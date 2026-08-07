import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, checked before resizing
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
// Photos straight off a phone camera can be several MB, which is far too
// slow to reload every few seconds on the lobby's rotating teaser gallery
// (especially on mobile data), so every upload is resized and re-encoded.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 78;

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

  const resized = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate() // auto-orient from EXIF before stripping it
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  const supabase = getSupabaseServerClient();
  const path = `${game.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("question-images")
    .upload(path, resized, { contentType: "image/jpeg", upsert: false });
  if (uploadError) return jsonError(uploadError.message, 500);

  const { data } = supabase.storage.from("question-images").getPublicUrl(path);

  return NextResponse.json({ imageUrl: data.publicUrl });
}

export const POST = withApiErrorHandling(handlePost);
