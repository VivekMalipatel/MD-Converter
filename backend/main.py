from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from markitdown import MarkItDown
from io import BytesIO

app = FastAPI()
md = MarkItDown()

SUPPORTED = {
    '.pdf',
    '.docx', '.xlsx', '.xls', '.pptx',
    '.epub', '.msg',
    '.html', '.htm',
    '.txt', '.text', '.md', '.markdown',
    '.json', '.jsonl', '.csv',
    '.jpg', '.jpeg', '.png',
    '.wav', '.mp3', '.m4a', '.mp4',
    '.ipynb', '.zip',
}

@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    ext = '.' + (file.filename or '').rsplit('.', 1)[-1].lower()
    if ext not in SUPPORTED:
        raise HTTPException(status_code=422, detail=f'File type "{ext}" is not supported. Supported: {", ".join(sorted(SUPPORTED))}')
    data = await file.read()
    try:
        result = md.convert_stream(BytesIO(data), file_extension=ext)
        text = getattr(result, 'text_content', '') or getattr(result, 'markdown', '') or ''
        title = getattr(result, 'title', '') or ''
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Conversion failed: {e}')
    if not text.strip():
        raise HTTPException(status_code=422, detail='No content could be extracted from this file.')
    return JSONResponse({'markdown': text, 'title': title})

@app.get("/health")
async def health():
    return {"ok": True}
