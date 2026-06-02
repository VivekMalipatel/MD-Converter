import { NextRequest, NextResponse } from 'next/server';
import { MarkItDown } from 'markitdown-ts';

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.xlsx', '.html', '.txt', '.csv',
  '.xml', '.rss', '.atom', '.ipynb', '.zip',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
  '.mp3', '.wav', '.ogg', '.m4a',
]);

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

  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      {
        error: `File type "${ext || file.name}" is not supported.\n\nSupported formats: ${[...SUPPORTED_EXTENSIONS].join(', ')}`,
      },
      { status: 422 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const markitdown = new MarkItDown();

  let result;
  try {
    result = await markitdown.convertBuffer(buffer, { file_extension: ext });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Conversion failed: ${message}` }, { status: 422 });
  }

  if (!result || !result.markdown?.trim()) {
    return NextResponse.json({ error: 'No content could be extracted from this file.' }, { status: 422 });
  }

  return NextResponse.json({ markdown: result.markdown, title: result.title ?? null });
}
