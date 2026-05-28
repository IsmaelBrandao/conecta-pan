import { supabase } from '../config/supabase.js';

const BUCKET = 'chat-images';
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Recebe uma imagem em dataURL (base64), valida, envia ao Supabase
 * Storage (bucket publico) e retorna a URL publica.
 */
export async function uploadImage({ dataUrl, senderId }) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Formato de imagem invalido');

  const mime = match[1];
  const ext = ALLOWED[mime];
  if (!ext) throw new Error('Tipo de imagem nao suportado');

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength > MAX_BYTES) throw new Error('Imagem muito grande (max 6MB)');

  const path = `${senderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
