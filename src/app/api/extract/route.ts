// Reads account numbers from a screenshot. The image is processed in memory and never stored.
import { NextResponse } from 'next/server';
import { extractAccounts, IMAGE_TYPES } from '@/lib/ai';
import { webCaller } from '@/lib/caller';
import { rateLimit } from '@/lib/db';

export async function POST(req: Request) {
  if (!rateLimit('extract', webCaller(req).key, 30)) {
    return NextResponse.json({ error: 'Too many screenshots. Try again in an hour, or type the number.' }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('image');
  if (!(file instanceof File) || !IMAGE_TYPES.test(file.type)) return NextResponse.json({ error: 'Upload a PNG, JPEG, WebP or HEIC image' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 8 MB' }, { status: 400 });
  const accounts = await extractAccounts(Buffer.from(await file.arrayBuffer()), file.type);
  if (accounts === null) return NextResponse.json({ error: "Couldn't read that image. Type the number instead." }, { status: 422 });
  return NextResponse.json({ accounts });
}
