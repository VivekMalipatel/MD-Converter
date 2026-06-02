import { NextRequest, NextResponse } from 'next/server';

const BACKEND = 'http://127.0.0.1:8001/convert';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request — expected multipart/form-data.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const body = new FormData();
  body.append('file', file);

  let res: Response;
  try {
    res = await fetch(BACKEND, { method: 'POST', body });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable. Please try again.' }, { status: 503 });
  }

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    return NextResponse.json({ error: data.detail ?? 'Conversion failed.' }, { status: res.status });
  }
  return NextResponse.json(data);
}
