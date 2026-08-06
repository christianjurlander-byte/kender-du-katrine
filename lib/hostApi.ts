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
