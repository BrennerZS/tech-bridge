import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Formato inválido. Use JPG, PNG, WEBP ou GIF.";
  if (file.size > MAX_BYTES) return "Imagem acima de 5 MB.";
  return null;
}

export async function uploadImage(userId: string, file: File, folder: string): Promise<string> {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

const cache = new Map<string, { url: string; exp: number }>();

export function useMediaUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    const c = cache.get(path);
    return c && c.exp > Date.now() ? c.url : null;
  });
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    if (/^https?:\/\//.test(path)) { setUrl(path); return; }
    const c = cache.get(path);
    if (c && c.exp > Date.now()) { setUrl(c.url); return; }
    let alive = true;
    void supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 6).then(({ data }) => {
      if (!alive || !data) return;
      cache.set(path, { url: data.signedUrl, exp: Date.now() + 1000 * 60 * 60 * 5 });
      setUrl(data.signedUrl);
    });
    return () => { alive = false; };
  }, [path]);
  return url;
}
