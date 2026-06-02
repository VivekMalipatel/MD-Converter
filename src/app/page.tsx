'use client';

import { useCallback, useRef, useState } from 'react';

const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.html', '.txt', '.csv',
  '.xml', '.rss', '.atom', '.ipynb', '.zip',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
  '.mp3', '.wav', '.ogg', '.m4a',
];

const EXTENSION_LABELS: Record<string, string> = {
  '.pdf': 'PDF',
  '.docx': 'Word',
  '.xlsx': 'Excel',
  '.html': 'HTML',
  '.txt': 'Text',
  '.csv': 'CSV',
  '.xml': 'XML',
  '.rss': 'RSS',
  '.atom': 'Atom',
  '.ipynb': 'Jupyter',
  '.zip': 'ZIP',
  '.jpg': 'JPEG',
  '.jpeg': 'JPEG',
  '.png': 'PNG',
  '.gif': 'GIF',
  '.webp': 'WebP',
  '.tiff': 'TIFF',
  '.bmp': 'BMP',
  '.mp3': 'MP3',
  '.wav': 'WAV',
  '.ogg': 'OGG',
  '.m4a': 'M4A',
};

type State =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'selected'; file: File }
  | { status: 'converting'; file: File }
  | { status: 'done'; file: File; markdown: string; title: string | null }
  | { status: 'error'; file: File; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
}

export default function Page() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setState({ status: 'error', file, message: `"${ext || file.name}" is not a supported file type.\n\nSupported: ${SUPPORTED_EXTENSIONS.join(', ')}` });
      return;
    }
    setState({ status: 'selected', file });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const convert = useCallback(async () => {
    if (state.status !== 'selected') return;
    const { file } = state;
    setState({ status: 'converting', file });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/convert', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: 'error', file, message: data.error ?? 'Conversion failed.' });
        return;
      }
      setState({ status: 'done', file, markdown: data.markdown, title: data.title ?? null });
    } catch {
      setState({ status: 'error', file, message: 'Network error. Please try again.' });
    }
  }, [state]);

  const download = useCallback(() => {
    if (state.status !== 'done') return;
    const blob = new Blob([state.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = state.file.name.replace(/\.[^.]+$/, '');
    a.download = `${base}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const copy = useCallback(async () => {
    if (state.status !== 'done') return;
    await navigator.clipboard.writeText(state.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [state]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const isDragging = state.status === 'dragging';
  const hasFile = state.status !== 'idle' && state.status !== 'dragging';
  const isConverting = state.status === 'converting';
  const isDone = state.status === 'done';
  const isError = state.status === 'error';

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">MD Converter</h1>
          <p className="text-zinc-400 text-base">
            Convert PDF, Word, Excel, images, and more to clean Markdown — instantly, in your browser.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setState((s) => s.status === 'idle' ? { status: 'dragging' } : s); }}
          onDragLeave={() => setState((s) => s.status === 'dragging' ? { status: 'idle' } : s)}
          onDrop={handleDrop}
          onClick={() => !hasFile && inputRef.current?.click()}
          className={[
            'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none',
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : hasFile
                ? 'border-zinc-700 bg-zinc-900/60 cursor-default'
                : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/60',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center py-14 px-8 gap-3">
            {/* Icon */}
            <div className={`rounded-full p-4 mb-1 ${isDragging ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
              {isConverting ? (
                <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : isDone ? (
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isError ? (
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>

            {/* State text */}
            {!hasFile && (
              <>
                <p className="text-white font-medium text-lg">{isDragging ? 'Drop to convert' : 'Drop a file or click to upload'}</p>
                <p className="text-zinc-500 text-sm text-center max-w-sm">
                  {Object.values(EXTENSION_LABELS).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
                </p>
              </>
            )}

            {hasFile && 'file' in state && (
              <div className="text-center">
                <p className={`font-semibold text-lg ${isError ? 'text-red-300' : isDone ? 'text-green-300' : 'text-white'}`}>
                  {state.file.name}
                </p>
                <p className="text-zinc-500 text-sm mt-0.5">{formatBytes(state.file.size)}</p>
                {isConverting && <p className="text-blue-400 text-sm mt-2 animate-pulse">Converting…</p>}
                {isError && (
                  <p className="text-red-400 text-sm mt-2 whitespace-pre-line max-w-sm mx-auto">{state.message}</p>
                )}
                {isDone && (
                  <p className="text-green-400 text-sm mt-2">
                    Converted — {state.markdown.split('\n').length} lines
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {(state.status === 'selected') && (
            <button
              onClick={convert}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              Convert to Markdown →
            </button>
          )}
          {isDone && (
            <>
              <button
                onClick={copy}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy Markdown'}
              </button>
              <button
                onClick={download}
                className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                Download .md
              </button>
            </>
          )}
          {hasFile && (
            <button
              onClick={reset}
              className={`py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-medium transition-colors ${isDone ? 'px-5' : 'flex-1'}`}
            >
              {isDone ? '✕' : 'Clear'}
            </button>
          )}
        </div>

        {/* Markdown Preview */}
        {isDone && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-zinc-500 text-sm font-medium">Preview</span>
              {'title' in state && state.title && (
                <span className="text-zinc-600 text-xs">{state.title}</span>
              )}
            </div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <pre className="p-5 text-sm text-zinc-300 overflow-auto max-h-[60vh] whitespace-pre-wrap leading-relaxed font-mono">
                {state.markdown}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-10">
          Powered by{' '}
          <a href="https://www.npmjs.com/package/markitdown-ts" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-500 underline">
            markitdown-ts
          </a>
          {' '}· Files processed server-side, never stored
        </p>
      </div>
    </div>
  );
}
