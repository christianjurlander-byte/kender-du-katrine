export async function hostFetch(
  path: string,
  hostToken: string,
  init?: { method?: string; body?: unknown }
) {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-host-token": hostToken,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Noget gik galt.");
  }
  return data;
}

/** Uploads a file (e.g. a question image) as multipart form data. */
export async function hostUploadFile(path: string, hostToken: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(path, {
    method: "POST",
    headers: { "x-host-token": hostToken },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Kunne ikke uploade billedet.");
  }
  return data as { imageUrl: string };
}
